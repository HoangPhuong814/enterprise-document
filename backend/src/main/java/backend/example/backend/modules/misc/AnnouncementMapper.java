package backend.example.backend.modules.misc;

import backend.example.backend.modules.misc.dto.AnnouncementRequest;
import backend.example.backend.modules.misc.dto.AnnouncementResponse;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface AnnouncementMapper {
    Announcement toAnnouncement(AnnouncementRequest request);
    AnnouncementResponse toAnnouncementResponse(Announcement announcement);
    void updateAnnouncement(@MappingTarget Announcement announcement, AnnouncementRequest request);
}
