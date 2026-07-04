package backend.example.backend;

import lombok.Builder;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class TestController {
    @GetMapping("/test")
    public ResponseEntity<String> testConnection()
    {
        return ResponseEntity
                .status(200)
                .body("Test controller ok");
    }
}
