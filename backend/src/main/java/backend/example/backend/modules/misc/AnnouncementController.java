package backend.example.backend.modules.misc;

import backend.example.backend.common.response.ApiResponse;
import backend.example.backend.common.response.PageResponse;
import backend.example.backend.modules.misc.dto.AnnouncementRequest;
import backend.example.backend.modules.misc.dto.AnnouncementResponse;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/announcements")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class AnnouncementController {
    AnnouncementService announcementService;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<AnnouncementResponse> createAnnouncement(@RequestBody AnnouncementRequest request) {
        return ApiResponse.<AnnouncementResponse>builder()
                .result(announcementService.createAnnouncement(request))
                .message("Announcement created successfully")
                .build();
    }

    @GetMapping("/{id}")
    public ApiResponse<AnnouncementResponse> getAnnouncement(@PathVariable Long id) {
        return ApiResponse.<AnnouncementResponse>builder()
                .result(announcementService.getAnnouncement(id))
                .message("Announcement retrieved successfully")
                .build();
    }

    @GetMapping
    public ApiResponse<PageResponse<AnnouncementResponse>> getAllAnnouncements(
            @RequestParam(value = "page", defaultValue = "1") int page,
            @RequestParam(value = "size", defaultValue = "10") int size) {
        return ApiResponse.<PageResponse<AnnouncementResponse>>builder()
                .result(announcementService.getAllAnnouncements(page, size))
                .message("Announcements retrieved successfully")
                .build();
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<AnnouncementResponse> updateAnnouncement(
            @PathVariable Long id,
            @RequestBody AnnouncementRequest request) {
        return ApiResponse.<AnnouncementResponse>builder()
                .result(announcementService.updateAnnouncement(id, request))
                .message("Announcement updated successfully")
                .build();
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<Void> deleteAnnouncement(@PathVariable Long id) {
        announcementService.deleteAnnouncement(id);
        return ApiResponse.<Void>builder()
                .message("Announcement deleted successfully")
                .build();
    }
}
