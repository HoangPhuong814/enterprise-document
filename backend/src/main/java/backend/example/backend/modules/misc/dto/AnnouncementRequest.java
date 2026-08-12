package backend.example.backend.modules.misc.dto;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AnnouncementRequest {
    String title;
    String content;
    boolean published;
    String authorEmail;
    LocalDateTime publishedAt;
}
