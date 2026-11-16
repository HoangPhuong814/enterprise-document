package backend.example.backend.modules.document.share;

import backend.example.backend.common.exception.AppException;
import backend.example.backend.common.exception.ErrorCode;
import backend.example.backend.config.WebSocketSessionManager;
import backend.example.backend.modules.document.Document;
import backend.example.backend.modules.document.DocumentAccessPolicy;
import backend.example.backend.modules.document.DocumentRepository;
import backend.example.backend.modules.document.S3StorageService;
import backend.example.backend.modules.document.dto.ShareRequest;
import backend.example.backend.modules.document.dto.ShareResponse;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.experimental.NonFinal;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.Duration;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class DocumentShareService {
    private static final int MAX_PASSCODE_ATTEMPTS = 5;
    private static final Duration ATTEMPT_WINDOW = Duration.ofMinutes(15);
    private static final String ATTEMPT_KEY_PREFIX = "share:attempts:";

    DocumentShareRepository documentShareRepository;
    DocumentRepository documentRepository;
    S3StorageService s3StorageService;
    WebSocketSessionManager webSocketSessionManager;
    DocumentAccessPolicy accessPolicy;
    PasswordEncoder passwordEncoder;
    StringRedisTemplate redisTemplate;

    @Value("${app.frontend-url:http://localhost:5173}")
    @NonFinal
    String frontendUrl;

    @Transactional
    public ShareResponse createShareLink(Long documentId, ShareRequest request) {
        Document document = documentRepository.findByIdAndIsDeletedFalse(documentId)
                .orElseThrow(() -> new AppException(ErrorCode.DOCUMENT_NOT_FOUND));
        accessPolicy.assertCanManage(document);

        String rawPasscode = request.getPasscode();
        String passcodeHash = StringUtils.hasText(rawPasscode) ? passwordEncoder.encode(rawPasscode) : null;

        DocumentShare documentShare = DocumentShare.builder()
                .document(document)
                .shareToken(UUID.randomUUID().toString())
                .passcode(passcodeHash)
                .expiredAt(request.getExpiredAt() != null
                        ? LocalDateTime.ofInstant(request.getExpiredAt(), ZoneId.systemDefault()) : null)
                .maxDownloads(request.getMaxDownloads())
                .downloadCount(0)
                .build();

        return toResponse(documentShareRepository.save(documentShare));
    }

    /**
     * The row lock (findByShareTokenWithLock) serialises concurrent downloads of one link, so the
     * limit check and the counter increment are atomic. The counter is only incremented after the
     * presigned URL was produced, and the failed-attempt counter lives in Redis so it survives the
     * rollback caused by the exception.
     */
    @Transactional
    public String downloadSharedFile(String token, DownloadShareRequest request) {
        DocumentShare share = documentShareRepository.findByShareTokenWithLock(token)
                .orElseThrow(() -> new AppException(ErrorCode.SHARE_NOT_FOUND));

        if (share.getExpiredAt() != null && share.getExpiredAt().isBefore(LocalDateTime.now())) {
            throw new AppException(ErrorCode.SHARE_NOT_FOUND);
        }
        if (share.getMaxDownloads() != null && share.getDownloadCount() >= share.getMaxDownloads()) {
            throw new AppException(ErrorCode.SHARE_NOT_FOUND);
        }

        verifyPasscode(share, token, request);

        String presignedUrl = s3StorageService.generatePresignedUrlForShare(share.getDocument());

        share.setDownloadCount(share.getDownloadCount() + 1);
        documentShareRepository.save(share);
        notifyOwner(share);

        return presignedUrl;
    }

    @Transactional(readOnly = true)
    public List<ShareResponse> getSharesByDocumentId(Long documentId) {
        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new AppException(ErrorCode.DOCUMENT_NOT_FOUND));
        accessPolicy.assertCanManage(document);

        return documentShareRepository.findAllByDocumentId(documentId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public void revokeShareLink(String token) {
        DocumentShare share = documentShareRepository.findByShareToken(token)
                .orElseThrow(() -> new AppException(ErrorCode.SHARE_NOT_FOUND));
        accessPolicy.assertCanManage(share.getDocument());
        documentShareRepository.delete(share);
    }

    // ---------------------------------------------------------------- helpers

    private void verifyPasscode(DocumentShare share, String token, DownloadShareRequest request) {
        if (!StringUtils.hasText(share.getPasscode())) {
            return; // link is not passcode-protected
        }

        String key = ATTEMPT_KEY_PREFIX + token;
        String attempts = redisTemplate.opsForValue().get(key);
        if (attempts != null && Integer.parseInt(attempts) >= MAX_PASSCODE_ATTEMPTS) {
            throw new AppException(ErrorCode.TOO_MANY_ATTEMPTS);
        }

        String input = request != null ? request.getPasscode() : null;
        boolean matches = input != null && passwordEncoder.matches(input, share.getPasscode());
        if (!matches) {
            Long count = redisTemplate.opsForValue().increment(key);
            if (count != null && count == 1L) {
                redisTemplate.expire(key, ATTEMPT_WINDOW);
            }
            throw new AppException(ErrorCode.SHARE_PASSCODE_INVALID);
        }
        redisTemplate.delete(key);
    }

    private void notifyOwner(DocumentShare share) {
        try {
            String uploaderEmail = share.getDocument().getUploader().getEmail();
            String message = "Your doc [" + share.getDocument().getFileName() + "] "
                    + "just being downloaded through share link!";
            webSocketSessionManager.sendNotification(uploaderEmail, message);
        } catch (Exception e) {
            log.warn("Could not send WebSocket notification: {}", e.getMessage());
        }
    }

    /** The passcode (or its hash) is never returned to the client. */
    private ShareResponse toResponse(DocumentShare share) {
        return ShareResponse.builder()
                .shareToken(share.getShareToken())
                .shareUrl(frontendUrl + "/shares/download/" + share.getShareToken())
                .expiredAt(share.getExpiredAt())
                .maxDownloads(share.getMaxDownloads())
                .downloadCount(share.getDownloadCount())
                .hasPasscode(StringUtils.hasText(share.getPasscode()))
                .build();
    }
}
