package backend.example.backend.modules.document;

import backend.example.backend.modules.document.dto.CategoryRequest;
import backend.example.backend.modules.document.dto.CategoryResponse;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface CategoryMapper {
    Category toCategory(CategoryRequest request);
    CategoryResponse toCategoryResponse(Category category);
    void updateCategory(@MappingTarget Category category, CategoryRequest request);
}
