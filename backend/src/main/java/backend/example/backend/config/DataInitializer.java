package backend.example.backend.config;

import backend.example.backend.modules.user.*;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.HashSet;
import java.util.Set;

@Component
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class DataInitializer implements CommandLineRunner {
    UserRepository userRepository;
    RoleRepository roleRepository;
    PermissionRepository permissionRepository;
    PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        // 1. Initialize Permissions
        Permission readDoc = getOrCreatePermission("READ_DOCUMENT", "Read documents");
        Permission writeDoc = getOrCreatePermission("WRITE_DOCUMENT", "Upload or write documents");
        Permission deleteDoc = getOrCreatePermission("DELETE_DOCUMENT", "Delete documents");
        Permission createUser = getOrCreatePermission("CREATE_USER", "Create user accounts");
        Permission updateUser = getOrCreatePermission("UPDATE_USER", "Update user accounts");
        Permission deleteUser = getOrCreatePermission("DELETE_USER", "Delete user accounts");

        // 2. Initialize Roles
        Set<Permission> adminPermissions = new HashSet<>(Set.of(
                readDoc, writeDoc, deleteDoc, createUser, updateUser, deleteUser
        ));
        Role adminRole = getOrCreateRole("ADMIN", "System administrator role with full access", adminPermissions);

        Set<Permission> userPermissions = new HashSet<>(Set.of(readDoc));
        Role userRole = getOrCreateRole("USER", "Default user role with read access", userPermissions);

        // 3. Initialize Admin User if no users exist in DB
        if (userRepository.count() == 0) {
            User admin = User.builder()
                    .email("admin@dochub.com")
                    .name("System Administrator")
                    .password(passwordEncoder.encode("admin"))
                    .isActive(true)
                    .roles(new HashSet<>(Set.of(adminRole)))
                    .build();
            userRepository.save(admin);
            System.out.println("Default admin user created: admin@dochub.com");
        }
    }

    private Permission getOrCreatePermission(String name, String description) {
        return permissionRepository.findByName(name)
                .orElseGet(() -> permissionRepository.save(Permission.builder()
                        .name(name)
                        .description(description)
                        .build()));
    }

    private Role getOrCreateRole(String name, String description, Set<Permission> permissions) {
        Role role = roleRepository.findByName(name)
                .orElse(null);
        if (role == null) {
            role = Role.builder()
                    .name(name)
                    .description(description)
                    .permissions(permissions)
                    .build();
            return roleRepository.save(role);
        } else {
            role.setPermissions(permissions);
            return roleRepository.save(role);
        }
    }
}
