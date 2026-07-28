package backend.example.backend.modules.document.share;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface DocumentShareRepository extends JpaRepository<DocumentShare, Long> {
    Optional<DocumentShare> findByShareToken(String shareToken);
}
