package backend.example.backend.modules.document.share;

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
    String passcode;
    LocalDateTime expiredAt;
    Integer maxDownloads;
    int downloadCount;
}
