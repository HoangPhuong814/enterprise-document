package backend.example.backend.modules.document;

import backend.example.backend.modules.document.dto.DocumentResponse;
import backend.example.backend.modules.user.User;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface DocumentMapper {
    DocumentResponse toDocumentResponse(Document document);

    @Mapping(source = "name", target = "fullName")
    DocumentResponse.UploaderInfo toUploaderInfo(User user);

    DocumentResponse.CategoryInfo toCategoryInfo(Category category);
    java.util.List<DocumentResponse> toDocumentResponseList(java.util.List<Document> documents);
}
