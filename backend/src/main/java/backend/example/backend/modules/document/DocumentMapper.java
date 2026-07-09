package backend.example.backend.modules.document;

import backend.example.backend.modules.document.dto.DocumentResponse;
import backend.example.backend.modules.user.User;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface DocumentMapper {
    DocumentResponse toDocumentResponse(Document document);
    DocumentResponse.UploaderInfo toUploaderInfo(User user);
}
