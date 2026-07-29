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
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.URL;
import java.util.Date;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class S3StorageService {
    AmazonS3 amazonS3;
    DocumentRepository documentRepository;
    UserRepository userRepository;
    CategoryRepository categoryRepository;
    DocumentMapper documentMapper;

    @Value("${aws.s3.bucket-name}")
    @NonFinal
    String bucketName;

    @Transactional
    public Document uploadDocument(MultipartFile file, String uploaderEmail, Long categoryId) {
        User user = userRepository.findByEmail(uploaderEmail)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        Category category = null;
        if (categoryId != null) {
            category = categoryRepository.findById(categoryId)
                    .orElseThrow(() -> new AppException(ErrorCode.CATEGORY_NOT_FOUND));
        }

        String originalFileName = file.getOriginalFilename();
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
                    .build();
            return documentRepository.save(document);

        } catch (IOException e) {
            log.info("Error in doc s3: " + e);
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
        }
    }

    public String generatePresignedUrl(Long documentId)
    {
        Document document = documentRepository.findByIdAndIsDeletedFalse(documentId)
                .orElseThrow(()-> new AppException(ErrorCode.DOCUMENT_NOT_FOUND));

        String s3Url = document.getS3Url();
        String s3Key = getS3KeyFromUrl(s3Url);

        Date expiration = new Date();
        long expTimeMillis = expiration.getTime();
        expTimeMillis += 1000 * 60 * 10; // Đổi 10 phút ra miliseconds
        expiration.setTime(expTimeMillis);

        GeneratePresignedUrlRequest generatePresignedUrlRequest =
                new GeneratePresignedUrlRequest(bucketName, s3Key)
                        .withMethod(HttpMethod.GET)
                        .withExpiration(expiration);

        URL url = amazonS3.generatePresignedUrl(generatePresignedUrlRequest);

        return url.toString();
    }

    public PageResponse<DocumentResponse> getDocuments(String sortBy, String sortDir, int page, int size) {
        Sort sort = sortDir.equalsIgnoreCase(Sort.Direction.ASC.name())
                ? Sort.by(sortBy).ascending()
                : Sort.by(sortBy).descending();

        Pageable pageable = PageRequest.of(page - 1, size, sort);
        Page<Document> pageData = documentRepository.findAllByIsDeletedFalse(pageable);

        var documentResponses = pageData.getContent().stream()
                .map(documentMapper::toDocumentResponse)
                .toList();

        return PageResponse.<DocumentResponse>builder()
                .currentPage(page)
                .totalPages(pageData.getTotalPages())
                .pageSize(size)
                .totalElements(pageData.getTotalElements())
                .data(documentResponses)
                .build();
    }

    @Transactional
    public void deleteDocument(Long id) {
        Document document = documentRepository.findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> new AppException(ErrorCode.DOCUMENT_NOT_FOUND));

        document.setDeleted(true);
        document.setDeletedAt(java.time.LocalDateTime.now());
        documentRepository.save(document);
    }

    public PageResponse<DocumentResponse> getTrashDocuments(String sortBy, String sortDir, int page, int size) {
        Sort sort = sortDir.equalsIgnoreCase(Sort.Direction.ASC.name())
                ? Sort.by(sortBy).ascending()
                : Sort.by(sortBy).descending();

        Pageable pageable = PageRequest.of(page - 1, size, sort);
        Page<Document> pageData = documentRepository.findAllByIsDeletedTrue(pageable);

        var documentResponses = pageData.getContent().stream()
                .map(documentMapper::toDocumentResponse)
                .toList();

        return PageResponse.<DocumentResponse>builder()
                .currentPage(page)
                .totalPages(pageData.getTotalPages())
                .pageSize(size)
                .totalElements(pageData.getTotalElements())
                .data(documentResponses)
                .build();
    }

    @Transactional
    public void restoreDocument(Long id) {
        Document document = documentRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.DOCUMENT_NOT_FOUND));

        if (!document.isDeleted()) {
            return; // Nếu chưa xóa thì không cần khôi phục
        }

        document.setDeleted(false);
        document.setDeletedAt(null);
        documentRepository.save(document);
    }

    @Transactional
    public void hardDeleteDocument(Long id) {
        Document document = documentRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.DOCUMENT_NOT_FOUND));

        String s3Url = document.getS3Url();
        String s3Key = getS3KeyFromUrl(s3Url);

        try {
            amazonS3.deleteObject(bucketName, s3Key);
        }
        catch (Exception e) {
            log.error("Error when delete on s3 ", e);
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
        }

        documentRepository.delete(document);
    }

    private String getS3KeyFromUrl(String s3Url) {
        if (s3Url == null) return null;
        try {
            String encodedKey = s3Url.substring(s3Url.lastIndexOf("/") + 1);
            return java.net.URLDecoder.decode(encodedKey, java.nio.charset.StandardCharsets.UTF_8);
        } catch (Exception e) {
            log.error("Failed to decode S3 key from URL: " + s3Url, e);
            return s3Url.substring(s3Url.lastIndexOf("/") + 1);
        }
    }
}
