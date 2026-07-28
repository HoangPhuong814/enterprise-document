package backend.example.backend.modules.document;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface DocumentRepository extends JpaRepository<Document, Long> {
    Page<Document> findAllByIsDeletedFalse(Pageable pageable);
    Page<Document> findAllByIsDeletedTrue(Pageable pageable);
    Optional<Document> findByIdAndIsDeletedFalse(Long id);
}
