package backend.example.backend.config;

import backend.example.backend.modules.chat.ChatMessage;
import backend.example.backend.modules.chat.ChatMessageRepository;
import backend.example.backend.modules.user.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;

@Component
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ChatWebSocketHandler extends TextWebSocketHandler {
    ChatSessionManager chatSessionManager;
    ChatMessageRepository chatMessageRepository;
    UserRepository userRepository;
    ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws IOException {
        String email = getEmailFromUri(session.getUri());
        if (email != null)
        {
            chatSessionManager.addSession(email, session);
        }
        else {
            session.close(CloseStatus.BAD_DATA);
        }

    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        String senderEmail = getEmailFromUri(session.getUri());
        if (senderEmail == null) return;
        // Đọc dữ liệu JSON từ Client gửi lên
        ChatMessage payload = objectMapper.readValue(message.getPayload(), ChatMessage.class);
        payload.setSenderEmail(senderEmail);
        // 1. Lưu tin nhắn vào Database
        ChatMessage savedMessage = chatMessageRepository.save(payload);
        String jsonResponse = objectMapper.writeValueAsString(savedMessage);
        TextMessage outboundMessage = new TextMessage(jsonResponse);
        // 2. Định tuyến gửi tin
        if (payload.getRecipientEmail() != null) {
            // Chat 1-on-1 (Direct Message)
            // Gửi cho người nhận
            WebSocketSession recipientSession = chatSessionManager.getSession(payload.getRecipientEmail());
            if (recipientSession != null && recipientSession.isOpen()) {
                recipientSession.sendMessage(outboundMessage);
            }
            // Gửi phản hồi lại cho chính người gửi (để đồng bộ giao diện)
            if (session.isOpen()) {
                session.sendMessage(outboundMessage);
            }
        } else if (payload.getDepartmentRole() != null) {
            // Chat nhóm phòng ban (Group/Department Chat)
            // Gửi cho tất cả những người dùng có vai trò phù hợp, HOẶC là ADMIN
            chatSessionManager.getAllActiveSessions().forEach((email, activeSession) -> {
                if (activeSession.isOpen()) {
                    userRepository.findByEmail(email).ifPresent(user -> {
                        boolean hasRole = user.getRoles().stream()
                                .anyMatch(role -> role.getName().equals(payload.getDepartmentRole())
                                        || role.getName().equals("ADMIN"));
                        if (hasRole) {
                            try {
                                activeSession.sendMessage(outboundMessage);
                            }
                            catch (IOException e) {

                            }
                        }
                    });
                }
            });
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        String email = getEmailFromUri(session.getUri());
        if (email != null) {
            chatSessionManager.removeSession(email);
        }
    }

    private String getEmailFromUri(URI uri)
    {
        if(uri == null || uri.getQuery() == null)
        {
            return null;
        }

        for (String pr : uri.getQuery().split("&"))
        {
            String[] entry = pr.split("=");
            if(entry.length > 1 && "email".equals(entry[0]))
            {
                return URLDecoder.decode(entry[1], StandardCharsets.UTF_8);
            }
        }
        return null;
    }
}
