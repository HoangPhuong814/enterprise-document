package backend.example.backend.modules.document.dto;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ShareResponse {
    String shareToken;
    String shareUrl;
    boolean hasPasscode;
    LocalDateTime expiredAt;
    Integer maxDownloads;
    int downloadCount;
}
