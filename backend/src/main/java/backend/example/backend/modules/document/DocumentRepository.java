package backend.example.backend.modules.document;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.Optional;

@Repository
public interface DocumentRepository extends JpaRepository<Document, Long> {
    Page<Document> findAllByIsDeletedFalse(Pageable pageable);
    Page<Document> findAllByIsDeletedTrue(Pageable pageable);
    Optional<Document> findByIdAndIsDeletedFalse(Long id);

    @Query("SELECT d FROM Document d WHERE d.isDeleted = false AND (" +
           "d.uploader.email = :email OR " +
           "d.accessRole = 'PUBLIC' OR " +
           "d.accessRole IS NULL OR " +
           "d.accessRole IN :roles)")
    Page<Document> findAccessibleDocuments(
            @Param("email") String email,
            @Param("roles") Collection<String> roles,
            Pageable pageable
    );
}
