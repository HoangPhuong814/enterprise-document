package backend.example.backend.modules.document.share;

import backend.example.backend.common.response.ApiResponse;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class DocumentShareController {
    DocumentShareService documentShareService;

    @PostMapping("/documents/{id}/share")
    public ApiResponse<ShareResponse> shareDocument(
            @PathVariable Long id,
            @RequestBody ShareRequest request) {
        return ApiResponse.<ShareResponse>builder()
                .result(documentShareService.createShareLink(id, request))
                .message("Share link created successfully")
                .build();
    }

    @PostMapping("/shares/{token}/download")
    public ApiResponse<String> downloadSharedFile(
            @PathVariable String token,
            @RequestBody(required = false) DownloadShareRequest request) {
        String presignedUrl = documentShareService.downloadSharedFile(token, request);
        return ApiResponse.<String>builder()
                .result(presignedUrl)
                .message("Shared file download link generated successfully")
                .build();
    }
}
