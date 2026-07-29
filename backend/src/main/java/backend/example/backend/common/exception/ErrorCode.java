package backend.example.backend.common.exception;

import lombok.AccessLevel;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.http.HttpStatus;

@Getter
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public enum ErrorCode {
    UNCATEGORIZED_EXCEPTION(9999, "Uncategorized error", HttpStatus.INTERNAL_SERVER_ERROR),
    UNAUTHENTICATED(1001, "Unauthenticated", HttpStatus.UNAUTHORIZED),
    UNAUTHORIZED(1002, "You do not have permission", HttpStatus.FORBIDDEN),
    USER_EXISTED(1002, "User existed", HttpStatus.BAD_REQUEST),
    USER_NOT_EXISTED(1003, "User not existed", HttpStatus.NOT_FOUND),
    INVALID_PASSWORD(1004, "Invalid password",HttpStatus.BAD_REQUEST),
    PERMISSION_EXISTED(1005, "Permission already exists", HttpStatus.BAD_REQUEST),
    ROLE_EXISTED(1006, "Role already exists", HttpStatus.BAD_REQUEST),
    ROLE_NOT_EXISTED(1007, "Role not existed", HttpStatus.NOT_FOUND),
    DOCUMENT_NOT_FOUND(1008, "Document not found", HttpStatus.NOT_FOUND),
    CATEGORY_NOT_FOUND(1009, "Category not found", HttpStatus.NOT_FOUND),
    CATEGORY_EXISTED(1010, "Category already exists", HttpStatus.BAD_REQUEST),
    SHARE_NOT_FOUND(1011, "Share link not found or expired", HttpStatus.NOT_FOUND),
    SHARE_PASSCODE_INVALID(1012, "Invalid passcode for share link", HttpStatus.BAD_REQUEST);

    int code;
    String message;
    HttpStatus statusCode;

}
