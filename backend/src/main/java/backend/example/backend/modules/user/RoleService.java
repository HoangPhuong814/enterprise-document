package backend.example.backend.modules.user;

import backend.example.backend.common.exception.AppException;
import backend.example.backend.common.exception.ErrorCode;
import backend.example.backend.modules.user.dto.RoleRequest;
import backend.example.backend.modules.user.dto.RoleResponse;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Service;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class RoleService {
    RoleRepository roleRepository;
    PermissionRepository permissionRepository;
    RoleMapper roleMapper;

    public RoleResponse createRole(RoleRequest request) {
        if (roleRepository.existsByName(request.getName())) {
            throw new AppException(ErrorCode.ROLE_EXISTED);
        }

        Role role = roleMapper.toRole(request);

        Set<Permission> permissions = new HashSet<>();
        if (request.getPermissions() != null) {
            for (String permName : request.getPermissions()) {
                permissionRepository.findByName(permName).ifPresent(permissions::add);
            }
        }
        role.setPermissions(permissions);

        return roleMapper.toRoleResponse(roleRepository.save(role));
    }

    public List<RoleResponse> getAllRoles() {
        return roleMapper.toListRoleResponse(roleRepository.findAll());
    }

    public void deleteRole(Long roleId) {
        roleRepository.deleteById(roleId);
    }
}
