package backend.example.backend.modules.user.dto;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.Set;

@Builder
@Getter
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UserResponse {
    String id;
    String email;
    String name;
    Set<RoleResponse> roles;
}
