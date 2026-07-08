package backend.example.backend.modules.user.dto;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.Set;

@Builder
@Getter
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UserUpdateRequest {
    String name;
    String password;
    Set<String> roles;
}
