package backend.example.backend.modules.user;

import backend.example.backend.common.base.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "users")
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@EqualsAndHashCode(callSuper = true)
@FieldDefaults(level = AccessLevel.PRIVATE)
public class User extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(length = 36)
    String id;
    @Column(unique = true, nullable = false, length = 100)
    String email;
    @Column(name = "full_name", nullable = false, length = 100)
    String name;
    @Column(nullable = false)
    String password;
    @Column(nullable = false)
    @Builder.Default
    boolean isActive = true;
    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
            name = "user_roles",
            joinColumns = @JoinColumn(name = "user_id"),
            inverseJoinColumns = @JoinColumn(name = "role_id")
    )
    @Builder.Default
    Set<Role> roles = new HashSet<>();
}
