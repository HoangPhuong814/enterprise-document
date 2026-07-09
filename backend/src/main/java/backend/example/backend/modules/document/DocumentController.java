package backend.example.backend.modules.document;

import backend.example.backend.common.response.ApiResponse;
import backend.example.backend.common.response.PageResponse;
import backend.example.backend.modules.document.dto.DocumentResponse;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/documents")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class DocumentController {
    S3StorageService s3StorageService;
    DocumentMapper documentMapper;
    @PostMapping("/upload")
    public ApiResponse<DocumentResponse> uploadFile(@RequestParam("file") MultipartFile file,
                                                    Authentication authentication)
    {
        String email = authentication.getName();
        Document document = s3StorageService.uploadDocument(file, email);

        return ApiResponse.<DocumentResponse>builder()
                .result(documentMapper.toDocumentResponse(document))
                .message("Upload document successfully")
                .build();
    }

    @GetMapping("/{id}/download")
    public ApiResponse<String> getDownloadUrl(@PathVariable Long id) {

        String presignedUrl = s3StorageService.generatePresignedUrl(id);

        return ApiResponse.<String>builder()
                .result(presignedUrl)
                .message("File download link successfully created! The link is valid for 10 minutes.")
                .build();
    }

    @GetMapping
    public ApiResponse<PageResponse<DocumentResponse>> getDocuments(
            @RequestParam(value = "page", defaultValue = "1", required = false) int page,
            @RequestParam(value = "size", defaultValue = "10", required = false) int size,
            @RequestParam(value = "sortBy", defaultValue = "createdAt", required = false) String sortBy,
            @RequestParam(value = "sortDir", defaultValue = "desc", required = false) String sortDir) {

        PageResponse<DocumentResponse> pageResponse = s3StorageService.getDocuments(
                sortBy, sortDir, page, size);

        return ApiResponse.<PageResponse<DocumentResponse>>builder()
                .result(pageResponse)
                .message("Get document list successfully")
                .build();
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteDocument(@PathVariable Long id) {

        s3StorageService.deleteDocument(id);

        return ApiResponse.<Void>builder()
                .message("Delete document successfully")
                .build();
    }
}
