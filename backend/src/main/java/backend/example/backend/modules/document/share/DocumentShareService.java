package backend.example.backend.modules.document.share;

import backend.example.backend.common.exception.AppException;
import backend.example.backend.common.exception.ErrorCode;
import backend.example.backend.modules.document.Document;
import backend.example.backend.modules.document.DocumentRepository;
import backend.example.backend.modules.document.S3StorageService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class DocumentShareService {
    DocumentShareRepository documentShareRepository;
    DocumentRepository documentRepository;
    S3StorageService s3StorageService;

    @Transactional
    public ShareResponse createShareLink(Long documentId, ShareRequest request) {
        Document document = documentRepository.findByIdAndIsDeletedFalse(documentId)
                .orElseThrow(() -> new AppException(ErrorCode.DOCUMENT_NOT_FOUND));

        String token = UUID.randomUUID().toString();

        DocumentShare documentShare = DocumentShare.builder()
                .document(document)
                .shareToken(token)
                .passcode(request.getPasscode())
                .expiredAt(request.getExpiredAt())
                .maxDownloads(request.getMaxDownloads())
                .downloadCount(0)
                .build();

        DocumentShare saved = documentShareRepository.save(documentShare);

        String shareUrl = "http://localhost:8080/shares/download/" + token;

        return ShareResponse.builder()
                .shareToken(saved.getShareToken())
                .shareUrl(shareUrl)
                .passcode(saved.getPasscode())
                .expiredAt(saved.getExpiredAt())
                .maxDownloads(saved.getMaxDownloads())
                .downloadCount(saved.getDownloadCount())
                .build();
    }

    @Transactional
    public String downloadSharedFile(String token, DownloadShareRequest request) {
        DocumentShare share = documentShareRepository.findByShareToken(token)
                .orElseThrow(() -> new AppException(ErrorCode.SHARE_NOT_FOUND));

        // Kiểm tra hết hạn theo thời gian
        if (share.getExpiredAt() != null && share.getExpiredAt().isBefore(LocalDateTime.now())) {
            throw new AppException(ErrorCode.SHARE_NOT_FOUND);
        }

        // Kiểm tra giới hạn lượt tải xuống
        if (share.getMaxDownloads() != null && share.getDownloadCount() >= share.getMaxDownloads()) {
            throw new AppException(ErrorCode.SHARE_NOT_FOUND);
        }

        // Kiểm tra passcode nếu có
        if (share.getPasscode() != null && !share.getPasscode().trim().isEmpty()) {
            String clientPasscode = (request != null) ? request.getPasscode() : null;
            if (!share.getPasscode().equals(clientPasscode)) {
                throw new AppException(ErrorCode.SHARE_PASSCODE_INVALID);
            }
        }

        // Tăng lượt tải
        share.setDownloadCount(share.getDownloadCount() + 1);
        documentShareRepository.save(share);

        // Sinh link S3 presigned
        return s3StorageService.generatePresignedUrl(share.getDocument().getId());
    }
}
