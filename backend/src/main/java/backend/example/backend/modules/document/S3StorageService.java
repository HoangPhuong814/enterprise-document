package backend.example.backend.modules.document;

import backend.example.backend.common.exception.AppException;
import backend.example.backend.common.exception.ErrorCode;
import backend.example.backend.common.response.PageResponse;
import backend.example.backend.modules.document.dto.DocumentResponse;
import backend.example.backend.modules.user.User;
import backend.example.backend.modules.user.UserRepository;
import com.amazonaws.HttpMethod;
import com.amazonaws.services.s3.AmazonS3;
import com.amazonaws.services.s3.model.GeneratePresignedUrlRequest;
import com.amazonaws.services.s3.model.ObjectMetadata;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.experimental.NonFinal;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.URL;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.Collection;
import java.util.Collections;
import java.util.Date;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class S3StorageService {
    private static final Set<String> SORTABLE_FIELDS =
            Set.of("createdAt", "updatedAt", "fileName", "fileSize", "deletedAt");
    private static final int MAX_PAGE_SIZE = 100;
    private static final long PRESIGNED_URL_TTL_MILLIS = 10 * 60 * 1000L;
    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
            "application/pdf",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "image/png",
            "image/jpeg");
    private static final Set<String> ALLOWED_EXTENSIONS = Set.of(".pdf", ".docx", ".png", ".jpg", ".jpeg");

    AmazonS3 amazonS3;
    DocumentRepository documentRepository;
    UserRepository userRepository;
    CategoryRepository categoryRepository;
    DocumentMapper documentMapper;
    DocumentAccessPolicy accessPolicy;

    @Value("${aws.s3.bucket-name}")
    @NonFinal
    String bucketName;

    @Transactional
    public Document uploadDocument(MultipartFile file, String uploaderEmail, Long categoryId, String accessRole) {
        User user = userRepository.findByEmail(uploaderEmail)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        Category category = null;
        if (categoryId != null) {
            category = categoryRepository.findById(categoryId)
                    .orElseThrow(() -> new AppException(ErrorCode.CATEGORY_NOT_FOUND));
        }

        String originalFileName = sanitizeFileName(file.getOriginalFilename());
        validateFileType(originalFileName, file.getContentType());
        String uniqueFileName = UUID.randomUUID() + "_" + originalFileName;

        ObjectMetadata metadata = new ObjectMetadata();
        metadata.setContentLength(file.getSize());
        metadata.setContentType(file.getContentType());

        try {
            amazonS3.putObject(bucketName, uniqueFileName, file.getInputStream(), metadata);
            String fileUrl = amazonS3.getUrl(bucketName, uniqueFileName).toString();

            Document document = Document.builder()
                    .fileName(originalFileName)
                    .fileType(file.getContentType())
                    .fileSize(file.getSize())
                    .s3Url(fileUrl)
                    .uploader(user)
                    .category(category)
                    .accessRole(accessRole != null && !accessRole.isEmpty() ? accessRole : "PUBLIC")
                    .build();
            return documentRepository.save(document);

        } catch (IOException e) {
            log.error("Failed to upload document to S3", e);
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
        }
    }

    /** Download for an authenticated user: the caller must be allowed to view the document. */
    @Transactional(readOnly = true)
    public String generatePresignedUrl(Long documentId) {
        Document document = documentRepository.findByIdAndIsDeletedFalse(documentId)
                .orElseThrow(() -> new AppException(ErrorCode.DOCUMENT_NOT_FOUND));
        accessPolicy.assertCanView(document);
        return presign(document);
    }

    /**
     * Download for a guest holding a valid share token. The caller (DocumentShareService)
     * has already validated token, expiry, download limit and passcode, so no user check here.
     */
    public String generatePresignedUrlForShare(Document document) {
        if (document.isDeleted()) {
            throw new AppException(ErrorCode.DOCUMENT_NOT_FOUND);
        }
        return presign(document);
    }

    private String presign(Document document) {
        String s3Key = getS3KeyFromUrl(document.getS3Url());
        Date expiration = new Date(System.currentTimeMillis() + PRESIGNED_URL_TTL_MILLIS);

        GeneratePresignedUrlRequest request = new GeneratePresignedUrlRequest(bucketName, s3Key)
                .withMethod(HttpMethod.GET)
                .withExpiration(expiration);

        URL url = amazonS3.generatePresignedUrl(request);
        return url.toString();
    }

    @Transactional(readOnly = true)
    public PageResponse<DocumentResponse> getDocuments(String sortBy, String sortDir, int page, int size) {
        Pageable pageable = buildPageable(sortBy, sortDir, page, size, "createdAt");

        Authentication auth = accessPolicy.requireAuth();
        Page<Document> pageData;
        if (accessPolicy.isAdmin(auth)) {
            pageData = documentRepository.findAllByIsDeletedFalse(pageable);
        } else {
            Set<String> authorities = accessPolicy.authorities(auth);
            Collection<String> rolesToPass = authorities.isEmpty() ? Collections.singletonList("NONE") : authorities;
            pageData = documentRepository.findAccessibleDocuments(auth.getName(), rolesToPass, pageable);
        }
        return toPageResponse(pageData, pageable);
    }

    @Transactional
    public void deleteDocument(Long id) {
        Document document = documentRepository.findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> new AppException(ErrorCode.DOCUMENT_NOT_FOUND));
        accessPolicy.assertCanManage(document);

        document.setDeleted(true);
        document.setDeletedAt(java.time.LocalDateTime.now());
        documentRepository.save(document);
    }

    /** Admin sees every trashed document; everyone else sees only their own. */
    @Transactional(readOnly = true)
    public PageResponse<DocumentResponse> getTrashDocuments(String sortBy, String sortDir, int page, int size) {
        Pageable pageable = buildPageable(sortBy, sortDir, page, size, "deletedAt");

        Authentication auth = accessPolicy.requireAuth();
        Page<Document> pageData = accessPolicy.isAdmin(auth)
                ? documentRepository.findAllByIsDeletedTrue(pageable)
                : documentRepository.findAllByIsDeletedTrueAndUploaderEmail(auth.getName(), pageable);
        return toPageResponse(pageData, pageable);
    }

    @Transactional
    public void restoreDocument(Long id) {
        Document document = documentRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.DOCUMENT_NOT_FOUND));
        accessPolicy.assertCanManage(document);

        if (!document.isDeleted()) {
            return; // not in trash, nothing to restore
        }

        document.setDeleted(false);
        document.setDeletedAt(null);
        documentRepository.save(document);
    }

    /**
     * Permanent delete is only allowed from the trash. The database row is removed first and the
     * S3 object is deleted after the transaction commits: a failed S3 call leaves a harmless
     * orphan object, instead of a database row that points to a file that no longer exists.
     */
    @Transactional
    public void hardDeleteDocument(Long id) {
        Document document = documentRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.DOCUMENT_NOT_FOUND));
        accessPolicy.assertCanManage(document);

        if (!document.isDeleted()) {
            throw new AppException(ErrorCode.DOCUMENT_NOT_FOUND);
        }

        String s3Key = getS3KeyFromUrl(document.getS3Url());
        documentRepository.delete(document);

        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                try {
                    amazonS3.deleteObject(bucketName, s3Key);
                } catch (Exception e) {
                    log.error("Document row deleted but S3 object '{}' could not be removed", s3Key, e);
                }
            }
        });
    }

    @Transactional(readOnly = true)
    public Document getDocumentById(Long id) {
        Document document = documentRepository.findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> new AppException(ErrorCode.DOCUMENT_NOT_FOUND));
        accessPolicy.assertCanView(document);
        return document;
    }

    @Transactional
    public Document updateDocument(Long id, Long categoryId, String accessRole) {
        Document document = documentRepository.findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> new AppException(ErrorCode.DOCUMENT_NOT_FOUND));
        accessPolicy.assertCanManage(document);

        if (categoryId != null) {
            Category category = categoryRepository.findById(categoryId)
                    .orElseThrow(() -> new AppException(ErrorCode.CATEGORY_NOT_FOUND));
            document.setCategory(category);
        } else {
            document.setCategory(null);
        }

        if (accessRole != null) {
            document.setAccessRole(accessRole);
        }

        return documentRepository.save(document);
    }

    // ---------------------------------------------------------------- helpers

    private Pageable buildPageable(String sortBy, String sortDir, int page, int size, String defaultSortField) {
        String sortField = SORTABLE_FIELDS.contains(sortBy) ? sortBy : defaultSortField;
        Sort sort = "asc".equalsIgnoreCase(sortDir)
                ? Sort.by(sortField).ascending()
                : Sort.by(sortField).descending();
        int safePage = Math.max(page, 1) - 1;
        int safeSize = Math.min(Math.max(size, 1), MAX_PAGE_SIZE);
        return PageRequest.of(safePage, safeSize, sort);
    }

    private PageResponse<DocumentResponse> toPageResponse(Page<Document> pageData, Pageable pageable) {
        var documentResponses = pageData.getContent().stream()
                .map(documentMapper::toDocumentResponse)
                .toList();

        return PageResponse.<DocumentResponse>builder()
                .currentPage(pageable.getPageNumber() + 1)
                .totalPages(pageData.getTotalPages())
                .pageSize(pageable.getPageSize())
                .totalElements(pageData.getTotalElements())
                .data(documentResponses)
                .build();
    }

    private String sanitizeFileName(String originalFileName) {
        if (originalFileName == null || originalFileName.isBlank()) {
            throw new AppException(ErrorCode.INVALID_FILE_FORMAT);
        }
        // Path separators would break key extraction and have no place in a display name.
        return originalFileName.replaceAll("[\\\\/]", "_");
    }

    private void validateFileType(String fileName, String contentType) {
        String lower = fileName.toLowerCase(Locale.ROOT);
        boolean extensionOk = ALLOWED_EXTENSIONS.stream().anyMatch(lower::endsWith);
        boolean typeOk = contentType != null && ALLOWED_CONTENT_TYPES.contains(contentType);
        if (!extensionOk || !typeOk) {
            throw new AppException(ErrorCode.INVALID_FILE_FORMAT);
        }
    }

    private String getS3KeyFromUrl(String s3Url) {
        if (s3Url == null) return null;
        try {
            String encodedKey = s3Url.substring(s3Url.lastIndexOf("/") + 1);
            return URLDecoder.decode(encodedKey, StandardCharsets.UTF_8);
        } catch (Exception e) {
            log.error("Failed to decode S3 key from URL: {}", s3Url, e);
            return s3Url.substring(s3Url.lastIndexOf("/") + 1);
        }
    }
}
