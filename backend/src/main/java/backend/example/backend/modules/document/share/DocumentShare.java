package backend.example.backend.modules.document.share;

import backend.example.backend.common.base.BaseEntity;
import backend.example.backend.modules.document.Document;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Entity
@Table(name = "document_shares")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
@FieldDefaults(level = AccessLevel.PRIVATE)
public class DocumentShare extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "document_id", nullable = false)
    Document document;

    @Column(name = "share_token", nullable = false, unique = true, length = 100)
    String shareToken;

    @Column(length = 100)
    String passcode; // optional password

    @Column(name = "expired_at")
    LocalDateTime expiredAt; // optional expiration time

    @Column(name = "download_count", nullable = false)
    @Builder.Default
    int downloadCount = 0;

    @Column(name = "max_downloads")
    Integer maxDownloads; // optional max downloads count
}
