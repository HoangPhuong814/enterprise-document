package backend.example.backend.modules.document;

import backend.example.backend.common.base.BaseEntity;
import backend.example.backend.modules.user.User;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Entity
@Table(name = "documents")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Document extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    @Column(name = "file_name", nullable = false)
    String fileName; // Tên file gốc (VD: bao_cao_thang_7.pdf)

    @Column(name = "file_type", length = 50)
    String fileType; // Định dạng file (VD: application/pdf)

    @Column(name = "file_size")
    Long fileSize; // Dung lượng file (tính bằng byte)

    @Column(name = "s3_url", nullable = false, length = 1000)
    String s3Url; // Đường dẫn thực tế để tải file từ AWS S3

    // Liên kết với người upload (Nhiều Document thuộc về 1 User)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "uploader_id", nullable = false)
    User uploader;

    // Liên kết với danh mục (Nhiều Document thuộc về 1 Category)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    Category category;

    @Column(name = "is_deleted", nullable = false, columnDefinition = "boolean default false")
    @Builder.Default
    boolean isDeleted = false;

    @Column(name = "deleted_at")
    LocalDateTime deletedAt;
}
