package backend.example.backend.modules.misc.dto;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AnnouncementResponse {
    Long id;
    String title;
    String content;
    String authorEmail;
    boolean published;
    LocalDateTime publishedAt;
}
