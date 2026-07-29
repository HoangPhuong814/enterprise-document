package backend.example.backend.modules.document.share;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ShareRequest {
    String passcode;
    Instant expiredAt;
    Integer maxDownloads;
}
