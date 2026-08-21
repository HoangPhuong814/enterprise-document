package backend.example.backend.modules.log;

import backend.example.backend.common.response.ApiResponse;
import backend.example.backend.modules.document.dto.DocumentResponse;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.JoinPoint;
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
    backend.example.backend.modules.document.DocumentRepository documentRepository;

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
            pointcut = "execution(* backend.example.backend.modules.document.DocumentController.getDownloadUrl(..))"
    )
    public void logDownloadAction(JoinPoint joinPoint)
    {
        try {
            Object[] args = joinPoint.getArgs();
            if (args.length == 0 || !(args[0] instanceof Long)) return;
            Long id = (Long) args[0];

            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String email = (auth != null) ? auth.getName() : "Anonymous";

            String documentName = "Unknown File";
            try {
                documentName = documentRepository.findById(id)
                        .map(d -> d.getFileName())
                        .orElse("FILE ID: " + id);
            } catch (Exception e) {
                // ignore
            }

            ActivityLog activityLog = ActivityLog.builder()
                    .userEmail(email)
                    .action("DOWNLOAD_DOCUMENT")
                    .documentName(documentName)
                    .timestamp(LocalDateTime.now())
                    .build();

            activityLogRepository.save(activityLog);
        }
        catch (Exception e) {
            log.error("Error when download: " + e);
        }
    }

    @AfterReturning(
            pointcut = "execution(* backend.example.backend.modules.document.DocumentController.deleteDocument(..))"
    )
    public void logDeleteAction(JoinPoint joinPoint)
    {
        try {
            Object[] args = joinPoint.getArgs();
            if (args.length == 0 || !(args[0] instanceof Long)) return;
            Long id = (Long) args[0];

            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String email = (auth != null) ? auth.getName() : "Anonymous";

            String documentName = "Unknown File";
            try {
                documentName = documentRepository.findById(id)
                        .map(d -> d.getFileName())
                        .orElse("FILE ID: " + id);
            } catch (Exception e) {
                // ignore
            }

            ActivityLog activityLog = ActivityLog.builder()
                    .userEmail(email)
                    .action("DELETE_DOCUMENT")
                    .documentName(documentName)
                    .timestamp(LocalDateTime.now())
                    .build();

            activityLogRepository.save(activityLog);
        }
        catch (Exception e) {
            log.error("Error when delete: " + e);
        }
    }
}
