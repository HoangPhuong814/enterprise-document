package backend.example.backend.modules.document;

import backend.example.backend.common.response.ApiResponse;
import backend.example.backend.modules.document.dto.DocumentResponse;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
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
}
