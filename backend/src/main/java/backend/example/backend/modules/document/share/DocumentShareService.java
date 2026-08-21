package backend.example.backend.modules.document.share;

import backend.example.backend.common.exception.AppException;
import backend.example.backend.common.exception.ErrorCode;
import backend.example.backend.config.WebSocketSessionManager;
import backend.example.backend.modules.document.Document;
import backend.example.backend.modules.document.DocumentRepository;
import backend.example.backend.modules.document.S3StorageService;
import backend.example.backend.modules.document.dto.ShareRequest;
import backend.example.backend.modules.document.dto.ShareResponse;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class DocumentShareService {
    DocumentShareRepository documentShareRepository;
    DocumentRepository documentRepository;
    S3StorageService s3StorageService;
    WebSocketSessionManager webSocketSessionManager;

    @Transactional
    public ShareResponse createShareLink(Long documentId, ShareRequest request) {
        Document document = documentRepository.findByIdAndIsDeletedFalse(documentId)
                .orElseThrow(() -> new AppException(ErrorCode.DOCUMENT_NOT_FOUND));

        String token = UUID.randomUUID().toString();

        DocumentShare documentShare = DocumentShare.builder()
                .document(document)
                .shareToken(token)
                .passcode(request.getPasscode())
                .expiredAt(request.getExpiredAt() != null ?
                        LocalDateTime.ofInstant(request.getExpiredAt(), ZoneId.systemDefault()) : null)
                .maxDownloads(request.getMaxDownloads())
                .downloadCount(0)
                .build();

        DocumentShare saved = documentShareRepository.save(documentShare);

        String shareUrl = "http://localhost:5173/shares/download/" + token;

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
        DocumentShare share = documentShareRepository.findByShareTokenWithLock(token)
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

        try {
            String uploaderEmail = share.getDocument().getUploader().getEmail();
            String message = "Your doc [" + share.getDocument().getFileName() + "] " +
                    "just being downloaded through share link!";
            webSocketSessionManager.sendNotification(uploaderEmail, message);
        } catch (Exception e) {
            System.err.println("Không gửi được thông báo WebSocket: " + e.getMessage());
        }

        // Sinh link S3 presigned
        return s3StorageService.generatePresignedUrl(share.getDocument().getId());
    }

    @Transactional(readOnly = true)
    public List<ShareResponse> getSharesByDocumentId(Long documentId) {
        if (!documentRepository.existsById(documentId)) {
            throw new AppException(ErrorCode.DOCUMENT_NOT_FOUND);
        }

        return documentShareRepository.findAllByDocumentId(documentId).stream()
                .map(share -> {
                    String shareUrl = "http://localhost:5173/shares/download/" + share.getShareToken();
                    return ShareResponse.builder()
                            .shareToken(share.getShareToken())
                            .shareUrl(shareUrl)
                            .passcode(share.getPasscode())
                            .expiredAt(share.getExpiredAt())
                            .maxDownloads(share.getMaxDownloads())
                            .downloadCount(share.getDownloadCount())
                            .build();
                })
                .toList();
    }

    @Transactional
    public void revokeShareLink(String token) {
        DocumentShare share = documentShareRepository.findByShareToken(token)
                .orElseThrow(() -> new AppException(ErrorCode.SHARE_NOT_FOUND));
        documentShareRepository.delete(share);
    }
}
