package backend.example.backend.modules.document;

import backend.example.backend.common.exception.AppException;
import backend.example.backend.common.exception.ErrorCode;
import backend.example.backend.modules.user.User;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class DocumentAccessPolicyTest {

    private DocumentAccessPolicy policy;

    @BeforeEach
    void setUp() {
        policy = new DocumentAccessPolicy();
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    private void authenticate(String email, List<String> roles) {
        var authorities = roles.stream().map(SimpleGrantedAuthority::new).toList();
        var auth = new UsernamePasswordAuthenticationToken(email, null, authorities);
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    @Test
    @DisplayName("Uploader can view their own private document")
    void uploaderCanViewOwnDocument() {
        authenticate("userA@company.com", List.of("ROLE_USER"));
        User userA = User.builder().email("userA@company.com").name("User A").build();
        Document doc = Document.builder()
                .uploader(userA)
                .accessRole("ROLE_DEPARTMENT_X")
                .build();

        assertDoesNotThrow(() -> policy.assertCanView(doc));
    }

    @Test
    @DisplayName("User B cannot view private document of User A when lacking role")
    void userBCannotViewPrivateDocumentOfUserA() {
        authenticate("userB@company.com", List.of("ROLE_USER"));
        User userA = User.builder().email("userA@company.com").name("User A").build();
        Document doc = Document.builder()
                .uploader(userA)
                .accessRole("ROLE_DEPARTMENT_X")
                .build();

        AppException ex = assertThrows(AppException.class, () -> policy.assertCanView(doc));
        assertEquals(ErrorCode.ACCESS_DENIED, ex.getErrorCode());
    }

    @Test
    @DisplayName("User B can view public document of User A")
    void userBCanViewPublicDocument() {
        authenticate("userB@company.com", List.of("ROLE_USER"));
        User userA = User.builder().email("userA@company.com").name("User A").build();
        Document doc = Document.builder()
                .uploader(userA)
                .accessRole("PUBLIC")
                .build();

        assertDoesNotThrow(() -> policy.assertCanView(doc));
    }

    @Test
    @DisplayName("Admin can view any document")
    void adminCanViewAnyDocument() {
        authenticate("admin@company.com", List.of("ROLE_admin"));
        User userA = User.builder().email("userA@company.com").name("User A").build();
        Document doc = Document.builder()
                .uploader(userA)
                .accessRole("ROLE_SECRET")
                .build();

        assertDoesNotThrow(() -> policy.assertCanView(doc));
    }

    @Test
    @DisplayName("User B cannot manage (delete/update/share) document of User A")
    void userBCannotManageDocumentOfUserA() {
        authenticate("userB@company.com", List.of("ROLE_USER"));
        User userA = User.builder().email("userA@company.com").name("User A").build();
        Document doc = Document.builder()
                .uploader(userA)
                .accessRole("PUBLIC") // Even if public, only owner or admin can manage
                .build();

        AppException ex = assertThrows(AppException.class, () -> policy.assertCanManage(doc));
        assertEquals(ErrorCode.ACCESS_DENIED, ex.getErrorCode());
    }
}

