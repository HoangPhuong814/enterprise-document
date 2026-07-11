package backend.example.backend.modules.log;

import backend.example.backend.common.response.ApiResponse;
import backend.example.backend.modules.document.dto.DocumentResponse;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.annotation.AfterReturning;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Pointcut;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Aspect
@Component
@RequiredArgsConstructor
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ActivityLogAspect {
    ActivityLogRepository activityLogRepository;
    @Pointcut("execution(* backend.example.backend.modules.document.DocumentController.*(..))")
    public void documentControllerMethods() {}

    @AfterReturning(
            pointcut = "execution(* backend.example.backend.modules.document.DocumentController.uploadFile(..))",
            returning = "result"
    )
    public void logUploadAction(Object result) {
        try {
            ApiResponse<DocumentResponse> response = (ApiResponse<DocumentResponse>) result;
            DocumentResponse docData = response.getResult();

            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String email = (auth != null) ? auth.getName() : "Anonymous";

            ActivityLog activityLog = ActivityLog.builder()
                    .userEmail(email)
                    .action("UPLOAD_DOCUMENT")
                    .documentName(docData.getFileName())
                    .timestamp(LocalDateTime.now())
                    .build();

            activityLogRepository.save(activityLog);

        } catch (Exception e) {
            log.error("Error when upload: ", e);
        }
    }

    @AfterReturning(
            pointcut = "execution(* backend.example.backend.modules.document.DocumentController.getDownloadUrl(..) " +
                    "&& args(id))",
            returning = "result"

    )
    public void logDownloadAction(Long id, Object result)
    {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String email = (auth != null) ? auth.getName() : "Anonymous";

            ActivityLog activityLog = ActivityLog.builder()
                    .userEmail(email)
                    .action("DOWNLOAD_DOCUMENT")
                    .documentName("FILE ID: " + id)
                    .timestamp(LocalDateTime.now())
                    .build();

            activityLogRepository.save(activityLog);
        }
        catch (Exception e) {
            log.error("Error when download: " + e);
        }
    }

    @AfterReturning(
            pointcut = "execution(* backend.example.backend.modules.document.DocumentController.deleteDocument(..) " +
                    "&& args(id))",
            returning = "result"

    )
    public void logDeleteAction(Long id, Object result)
    {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String email = (auth != null) ? auth.getName() : "Anonymous";

            ActivityLog activityLog = ActivityLog.builder()
                    .userEmail(email)
                    .action("DELETE_DOCUMENT")
                    .documentName("FILE ID: " + id)
                    .timestamp(LocalDateTime.now())
                    .build();

            activityLogRepository.save(activityLog);
        }
        catch (Exception e) {
            log.error("Error when delete: " + e);
        }
    }
}
