package backend.example.backend.config;

import backend.example.backend.common.exception.AppException;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class WebSocketSessionManager {
    private final Map<String, WebSocketSession> userSessions = new ConcurrentHashMap<>();

    public void addSession(String email, WebSocketSession socketSession)
    {
        userSessions.put(email, socketSession);
    }

    public void removeSession(String email)
    {
        userSessions.remove(email);
    }

    public void sendNotification(String email, String message)
    {
        System.out.println("[WebSocket] Trying to send notification to: " + email);
        System.out.println("[WebSocket] Active sessions: " + userSessions.keySet());
        
        WebSocketSession session = userSessions.get(email);
        if(session != null && session.isOpen())
        {
            try {
                session.sendMessage(new TextMessage(message));
                System.out.println("[WebSocket] Notification sent successfully to: " + email);
            }
            catch (IOException e) {
                throw new RuntimeException("Error when send message: ", e);
            }
        }
        else {
            System.out.println("[WebSocket] User " + email + " currently offline or session closed. Available keys: " + userSessions.keySet());
        }
    }

}
