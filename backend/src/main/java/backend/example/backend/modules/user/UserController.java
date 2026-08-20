package backend.example.backend.modules.user;

import backend.example.backend.common.response.ApiResponse;
import backend.example.backend.common.response.PageResponse;
import backend.example.backend.modules.user.dto.RoleResponse;
import backend.example.backend.modules.user.dto.UserCreationRequest;
import backend.example.backend.modules.user.dto.UserResponse;
import backend.example.backend.modules.user.dto.UserUpdateRequest;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class UserController {
    UserService userService;

    @PostMapping("/create")
    ApiResponse<UserResponse> createUser(@RequestBody UserCreationRequest request) {
        return ApiResponse.<UserResponse>builder()
                .result(userService.createUser(request))
                .build();
    }

    @PostMapping("/create-employee")
    ApiResponse<UserResponse> createEmployee(@RequestBody UserCreationRequest request) {
        return ApiResponse.<UserResponse>builder()
                .result(userService.createEmployee(request))
                .build();
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    ApiResponse<PageResponse<UserResponse>> getAllUsers
            (@RequestParam(value = "page", defaultValue = "1") int page,
             @RequestParam(value = "size", defaultValue = "10") int size) {
        return ApiResponse.<PageResponse<UserResponse>>builder()
                .result(userService.getAllUsers(page, size))
                .build();
    }

    @GetMapping("/{id}")
    ApiResponse<UserResponse> getUserById(@PathVariable String id) {
        return ApiResponse.<UserResponse>builder()
                .result(userService.getUserById(id))
                .build();
    }

    @GetMapping("/my-info")
    ApiResponse<UserResponse> getMyInfo() {
        return ApiResponse.<UserResponse>builder()
                .result(userService.getMyInfo())
                .build();
    }

    @GetMapping("/chat-list")
    ApiResponse<List<UserResponse>> getChatList() {
        return ApiResponse.<List<UserResponse>>builder()
                .result(userService.getChatList())
                .build();
    }

    @GetMapping("/departments")
    ApiResponse<List<RoleResponse>> getDepartments() {
        return ApiResponse.<List<RoleResponse>>builder()
                .result(userService.getDepartments())
                .build();
    }

    @PutMapping("/{id}")
    ApiResponse<UserResponse> updateUser(@PathVariable String id, @RequestBody UserUpdateRequest request) {
        return ApiResponse.<UserResponse>builder()
                .result(userService.updateUser(id, request))
                .build();
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    ApiResponse<Void> deleteUser(@PathVariable String id) {
        userService.deleteUser(id);
        return ApiResponse.<Void>builder()
                .message("User deleted successfully")
                .build();
    }
}
