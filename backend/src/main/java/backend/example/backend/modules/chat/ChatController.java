package backend.example.backend.modules.chat;

import backend.example.backend.common.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/chat")
@RequiredArgsConstructor
public class ChatController {
    private final ChatMessageRepository chatMessageRepository;

    // Load lịch sử chat 1-on-1 giữa 2 người
    @GetMapping("/history/dm")
    public ApiResponse<List<ChatMessage>> getDirectMessages(
            @RequestParam String sender,
            @RequestParam String recipient) {
        List<ChatMessage> history = chatMessageRepository
                .findBySenderEmailAndRecipientEmailOrSenderEmailAndRecipientEmailOrderByCreatedAtAsc(
                        sender, recipient, recipient, sender);
        return ApiResponse.<List<ChatMessage>>builder().result(history).build();
    }

    // Load lịch sử chat phòng ban
    @GetMapping("/history/department/{roleName}")
    public ApiResponse<List<ChatMessage>> getDepartmentMessages(@PathVariable String roleName) {
        List<ChatMessage> history = chatMessageRepository.findByDepartmentRoleOrderByCreatedAtAsc(roleName);
        return ApiResponse.<List<ChatMessage>>builder().result(history).build();
    }
}
