package backend.example.backend.modules.document;

import backend.example.backend.common.exception.AppException;
import backend.example.backend.common.exception.ErrorCode;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.util.Set;
import java.util.stream.Collectors;

/**
 * Single place that decides who may see or manage a document.
 * The "view" rule mirrors DocumentRepository.findAccessibleDocuments so the list
 * endpoint and the single-document endpoints can never disagree.
 */
@Component
public class DocumentAccessPolicy {

    public Authentication requireAuth() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || auth instanceof AnonymousAuthenticationToken) {
            throw new AppException(ErrorCode.ACCESS_DENIED);
        }
        return auth;
    }

    public Set<String> authorities(Authentication auth) {
        return auth.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toSet());
    }

    public boolean isAdmin(Authentication auth) {
        Set<String> authorities = authorities(auth);
        return authorities.contains("ROLE_admin") || authorities.contains("admin");
    }

    /** Admin, uploader, public/unrestricted document, or a role that matches the document's accessRole. */
    public void assertCanView(Document document) {
        Authentication auth = requireAuth();
        if (isAdmin(auth) || isOwner(auth, document)) {
            return;
        }
        String accessRole = document.getAccessRole();
        if (accessRole == null || "PUBLIC".equals(accessRole)) {
            return;
        }
        if (authorities(auth).contains(accessRole)) {
            return;
        }
        throw new AppException(ErrorCode.ACCESS_DENIED);
    }

    /** Delete, restore, update, share: only the uploader or an admin. */
    public void assertCanManage(Document document) {
        Authentication auth = requireAuth();
        if (isAdmin(auth) || isOwner(auth, document)) {
            return;
        }
        throw new AppException(ErrorCode.ACCESS_DENIED);
    }

    private boolean isOwner(Authentication auth, Document document) {
        return document.getUploader() != null
                && auth.getName().equals(document.getUploader().getEmail());
    }
}

