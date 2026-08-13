package backend.example.backend.config;

import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketSession;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class ChatSessionManager {
    private final Map<String, WebSocketSession> sessions = new ConcurrentHashMap<>();

    public void addSession(String email, WebSocketSession socketSession)
    {
        sessions.put(email, socketSession);
    }

    public void removeSession(String email)
    {
        sessions.remove(email);
    }

    public WebSocketSession getSession(String email)
    {
        return sessions.get(email);
    }

    public Map<String, WebSocketSession> getAllActiveSessions()
    {
        return sessions;
    }
}
