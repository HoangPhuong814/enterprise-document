package backend.example.backend.modules.log;

import backend.example.backend.common.response.ApiResponse;
import backend.example.backend.common.response.PageResponse;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/activity-logs")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ActivityLogController {
    ActivityLogRepository activityLogRepository;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<PageResponse<ActivityLog>> getLogs(
            @RequestParam(value = "page", defaultValue = "1") int page,
            @RequestParam(value = "size", defaultValue = "10") int size,
            @RequestParam(value = "search", required = false) String search,
            @RequestParam(value = "action", required = false) String action
    ) {
        Pageable pageable = PageRequest.of(page - 1, size, Sort.by(Sort.Direction.DESC, "timestamp"));
        
        Page<ActivityLog> logPage;
        if (action != null && !action.isEmpty() && !"ALL".equalsIgnoreCase(action)) {
            if (search != null && !search.isEmpty()) {
                logPage = activityLogRepository.findByActionAndUserEmailContainingIgnoreCaseOrActionAndDocumentNameContainingIgnoreCase(
                        action, search, action, search, pageable
                );
            } else {
                logPage = activityLogRepository.findByAction(action, pageable);
            }
        } else {
            if (search != null && !search.isEmpty()) {
                logPage = activityLogRepository.findByUserEmailContainingIgnoreCaseOrDocumentNameContainingIgnoreCase(
                        search, search, pageable
                );
            } else {
                logPage = activityLogRepository.findAll(pageable);
            }
        }

        PageResponse<ActivityLog> pageResponse = PageResponse.<ActivityLog>builder()
                .currentPage(page)
                .pageSize(size)
                .totalPages(logPage.getTotalPages())
                .totalElements(logPage.getTotalElements())
                .data(logPage.getContent())
                .build();

        return ApiResponse.<PageResponse<ActivityLog>>builder()
                .result(pageResponse)
                .build();
    }
}
