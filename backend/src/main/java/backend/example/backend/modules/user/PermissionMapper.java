package backend.example.backend.modules.user;

import backend.example.backend.modules.user.dto.PermissionRequest;
import backend.example.backend.modules.user.dto.PermissionResponse;
import org.mapstruct.Mapper;

import java.util.List;

@Mapper(componentModel = "spring")
public interface PermissionMapper {
    Permission toPermission(PermissionRequest request);
    PermissionResponse toPermissionResponse(Permission permission);
    List<PermissionResponse> toListPermissionResponse(List<Permission> permissions);
}
