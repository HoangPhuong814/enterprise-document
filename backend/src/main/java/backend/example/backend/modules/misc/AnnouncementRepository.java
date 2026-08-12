package backend.example.backend.modules.misc;

import backend.example.backend.modules.document.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AnnouncementRepository extends JpaRepository<Announcement, Long> {
    Optional<Announcement> findByTitle(String title);
    boolean existsByTitle(String title);
}
