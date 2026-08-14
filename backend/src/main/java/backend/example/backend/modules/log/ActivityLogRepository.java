package backend.example.backend.modules.log;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface ActivityLogRepository extends MongoRepository<ActivityLog, String> {
    Page<ActivityLog> findByUserEmailContainingIgnoreCaseOrDocumentNameContainingIgnoreCase(
            String userEmail, String documentName, Pageable pageable
    );

    Page<ActivityLog> findByAction(String action, Pageable pageable);

    Page<ActivityLog> findByActionAndUserEmailContainingIgnoreCaseOrActionAndDocumentNameContainingIgnoreCase(
            String action1, String userEmail, String action2, String documentName, Pageable pageable
    );
}
