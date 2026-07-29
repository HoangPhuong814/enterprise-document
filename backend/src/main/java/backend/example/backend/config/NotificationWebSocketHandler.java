package backend.example.backend.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.net.URI;

@Component
@RequiredArgsConstructor
@Slf4j
public class NotificationWebSocketHandler extends TextWebSocketHandler {

    private final WebSocketSessionManager sessionManager;

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        String email = getEmailFromUri(session.getUri());
        if (email != null) {
            sessionManager.addSession(email, session);
            System.out.println("[WebSocket] User registered: " + email);
        } else {
            log.warn("WS refused to connect: not found user");
            session.close(CloseStatus.BAD_DATA);
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        String email = getEmailFromUri(session.getUri());
        if (email != null) {
            sessionManager.removeSession(email);
            System.out.println("[WebSocket] User disconnected: " + email);
        }
    }

    // Helper tách email từ query string (Ví dụ: ws://localhost:8080/ws-notifications?email=admin@example.com)
    private String getEmailFromUri(URI uri) {
        if (uri == null) return null;
        
        String query = uri.getQuery() != null ? uri.getQuery() : uri.getRawQuery();
        if (query == null) return null;

        for (String param : query.split("&")) {
            String[] entry = param.split("=");
            if (entry.length > 1 && "email".equals(entry[0])) {
                try {
                    return java.net.URLDecoder.decode(entry[1], java.nio.charset.StandardCharsets.UTF_8);
                } catch (Exception e) {
                    return entry[1];
                }
            }
        }
        return null;
    }
}
