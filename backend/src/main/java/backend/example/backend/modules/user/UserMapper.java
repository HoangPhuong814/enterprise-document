package backend.example.backend.modules.user;

import backend.example.backend.modules.user.dto.UserCreationRequest;
import backend.example.backend.modules.user.dto.UserResponse;
import backend.example.backend.modules.user.dto.UserUpdateRequest;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

import java.util.List;

@Mapper(componentModel = "spring", uses = {RoleMapper.class})
public interface UserMapper {
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "roles", ignore = true)
    User toUser(UserCreationRequest request);

    UserResponse toUserResponse(User user);

    List<UserResponse> toListUserResponse(List<User> users);

    @Mapping(target = "roles", ignore = true)
    void updateUser(@MappingTarget User user, UserUpdateRequest request);
}
