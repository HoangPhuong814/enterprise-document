package backend.example.backend.modules.document.share;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DocumentShareRepository extends JpaRepository<DocumentShare, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT d FROM DocumentShare d WHERE d.shareToken = :shareToken")
    Optional<DocumentShare> findByShareTokenWithLock(@Param("shareToken") String shareToken);

    Optional<DocumentShare> findByShareToken(String shareToken);

    List<DocumentShare> findAllByDocumentId(Long documentId);
}
