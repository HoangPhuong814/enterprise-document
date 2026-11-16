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
import backend.example.backend.modules.user.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Duration;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DocumentShareServiceTest {

    @Mock
    private DocumentShareRepository documentShareRepository;
    @Mock
    private DocumentRepository documentRepository;
    @Mock
    private S3StorageService s3StorageService;
    @Mock
    private WebSocketSessionManager webSocketSessionManager;
    @Mock
    private DocumentAccessPolicy accessPolicy;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private StringRedisTemplate redisTemplate;
    @Mock
    private ValueOperations<String, String> valueOperations;

    private DocumentShareService shareService;

    @BeforeEach
    void setUp() {
        shareService = new DocumentShareService(
                documentShareRepository,
                documentRepository,
                s3StorageService,
                webSocketSessionManager,
                accessPolicy,
                passwordEncoder,
                redisTemplate
        );
        ReflectionTestUtils.setField(shareService, "frontendUrl", "http://localhost:5173");
    }

    @Test
    @DisplayName("Create share link hashes raw passcode with PasswordEncoder")
    void createShareLink_HashesPasscode() {
        Long docId = 1L;
        Document document = Document.builder()
                .id(docId)
                .fileName("test.pdf")
                .uploader(User.builder().email("owner@company.com").build())
                .build();

        when(documentRepository.findByIdAndIsDeletedFalse(docId)).thenReturn(Optional.of(document));
        when(passwordEncoder.encode("Secret@123")).thenReturn("$2a$10$hashedPasscode");
        when(documentShareRepository.save(any(DocumentShare.class))).thenAnswer(inv -> inv.getArgument(0));

        ShareRequest req = ShareRequest.builder()
                .passcode("Secret@123")
                .maxDownloads(5)
                .build();

        ShareResponse response = shareService.createShareLink(docId, req);

        assertTrue(response.isHasPasscode());
        ArgumentCaptor<DocumentShare> captor = ArgumentCaptor.forClass(DocumentShare.class);
        verify(documentShareRepository).save(captor.capture());
        assertEquals("$2a$10$hashedPasscode", captor.getValue().getPasscode());
    }

    @Test
    @DisplayName("Download fails with SHARE_PASSCODE_INVALID and increments Redis attempt when passcode is wrong")
    void download_WrongPasscode_ThrowsException() {
        String token = "uuid-token";
        DocumentShare share = DocumentShare.builder()
                .shareToken(token)
                .passcode("$2a$10$hashed")
                .downloadCount(0)
                .maxDownloads(10)
                .build();

        when(documentShareRepository.findByShareTokenWithLock(token)).thenReturn(Optional.of(share));
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.get("share:attempts:" + token)).thenReturn("0");
        when(passwordEncoder.matches("WrongPass", "$2a$10$hashed")).thenReturn(false);
        when(valueOperations.increment("share:attempts:" + token)).thenReturn(1L);

        DownloadShareRequest req = DownloadShareRequest.builder().passcode("WrongPass").build();

        AppException ex = assertThrows(AppException.class, () -> shareService.downloadSharedFile(token, req));
        assertEquals(ErrorCode.SHARE_PASSCODE_INVALID, ex.getErrorCode());
        verify(redisTemplate).expire(eq("share:attempts:" + token), any(Duration.class));
    }

    @Test
    @DisplayName("Download blocked with SHARE_NOT_FOUND when max downloads reached")
    void download_MaxDownloadsReached_ThrowsException() {
        String token = "uuid-token";
        DocumentShare share = DocumentShare.builder()
                .shareToken(token)
                .downloadCount(5)
                .maxDownloads(5)
                .build();

        when(documentShareRepository.findByShareTokenWithLock(token)).thenReturn(Optional.of(share));

        DownloadShareRequest req = DownloadShareRequest.builder().build();

        AppException ex = assertThrows(AppException.class, () -> shareService.downloadSharedFile(token, req));
        assertEquals(ErrorCode.SHARE_NOT_FOUND, ex.getErrorCode());
    }

    @Test
    @DisplayName("Download locked with TOO_MANY_ATTEMPTS after 5 failed passcode attempts")
    void download_TooManyAttempts_ThrowsLockedException() {
        String token = "uuid-token";
        DocumentShare share = DocumentShare.builder()
                .shareToken(token)
                .passcode("$2a$10$hashed")
                .downloadCount(0)
                .maxDownloads(10)
                .build();

        when(documentShareRepository.findByShareTokenWithLock(token)).thenReturn(Optional.of(share));
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.get("share:attempts:" + token)).thenReturn("5");

        DownloadShareRequest req = DownloadShareRequest.builder().passcode("any").build();

        AppException ex = assertThrows(AppException.class, () -> shareService.downloadSharedFile(token, req));
        assertEquals(ErrorCode.TOO_MANY_ATTEMPTS, ex.getErrorCode());
        verify(passwordEncoder, never()).matches(anyString(), anyString());
    }
}

