package backend.example.backend.modules.chat;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {
    
    /**
     * Tìm kiếm toàn bộ lịch sử tin nhắn trực tiếp (Direct Message) giữa 2 người dùng.
     * Sắp xếp tăng dần theo thời gian tạo tin nhắn (cũ nhất trước, mới nhất sau).
     */
    @Query("SELECT c FROM ChatMessage c WHERE " +
           "(c.senderEmail = :sender AND c.recipientEmail = :recipient) OR " +
           "(c.senderEmail = :recipient AND c.recipientEmail = :sender) " +
           "ORDER BY c.createdAt ASC")
    List<ChatMessage> findDirectMessages(@Param("sender") String sender, @Param("recipient") String recipient);

    /**
     * Phương thức JPA Method Name tương đương với query trên (để tương thích động).
     */
    List<ChatMessage> findBySenderEmailAndRecipientEmailOrSenderEmailAndRecipientEmailOrderByCreatedAtAsc(
            String senderEmail1, String recipientEmail1, String senderEmail2, String recipientEmail2);

    /**
     * Tìm kiếm lịch sử tin nhắn của một phòng ban dựa trên tên vai trò.
     * Sắp xếp tăng dần theo thời gian tạo tin nhắn.
     */
    List<ChatMessage> findByDepartmentRoleOrderByCreatedAtAsc(String departmentRole);
}
