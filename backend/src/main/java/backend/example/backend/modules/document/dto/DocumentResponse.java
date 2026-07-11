package backend.example.backend.modules.document.dto;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class DocumentResponse {
    Long id;
    String fileName;
    String fileType;
    Long fileSize;
    String s3Url;
    UploaderInfo uploader;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @FieldDefaults(level = AccessLevel.PRIVATE)
    public static class UploaderInfo {
        String id;
        String email;
        String fullName;
    }
}
