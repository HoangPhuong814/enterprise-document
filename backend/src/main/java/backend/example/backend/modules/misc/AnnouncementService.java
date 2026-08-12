package backend.example.backend.modules.misc;

import backend.example.backend.common.exception.AppException;
import backend.example.backend.common.exception.ErrorCode;
import backend.example.backend.common.response.PageResponse;
import backend.example.backend.modules.misc.dto.AnnouncementRequest;
import backend.example.backend.modules.misc.dto.AnnouncementResponse;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class AnnouncementService {
    AnnouncementRepository announcementRepository;
    AnnouncementMapper announcementMapper;

    public AnnouncementResponse createAnnouncement(AnnouncementRequest request) {
        if (announcementRepository.existsByTitle(request.getTitle())) {
            throw new AppException(ErrorCode.ANNOUNCEMENT_EXISTED);
        }
        Announcement announcement = announcementMapper.toAnnouncement(request);
        if (announcement.isPublished() && announcement.getPublishedAt() == null) {
            announcement.setPublishedAt(LocalDateTime.now());
        }
        return announcementMapper.toAnnouncementResponse(announcementRepository.save(announcement));
    }

    public AnnouncementResponse getAnnouncement(Long id)
    {
        Announcement announcement = announcementRepository.findById(id)
                .orElseThrow(()-> new AppException(ErrorCode.ANNOUNCEMENT_NOT_FOUND));
        return announcementMapper.toAnnouncementResponse(announcement);
    }

    public PageResponse<AnnouncementResponse> getAllAnnouncements(int page, int size)
    {
        Pageable pageable = PageRequest.of(page - 1, size,
                Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Announcement> pageData = announcementRepository.findAll(pageable);
        var announcementResponses = pageData.getContent().stream()
                .map(announcementMapper::toAnnouncementResponse)
                .toList();
        return PageResponse.<AnnouncementResponse>builder()
                .totalPages(pageData.getTotalPages())
                .currentPage(page)
                .totalElements(pageData.getTotalElements())
                .data(announcementResponses)
                .build();
    }

    public AnnouncementResponse updateAnnouncement(Long id, AnnouncementRequest request) {
        Announcement announcement = announcementRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.ANNOUNCEMENT_NOT_FOUND));

        if (!announcement.getTitle().equals(request.getTitle()) &&
                announcementRepository.existsByTitle(request.getTitle())) {
            throw new AppException(ErrorCode.ANNOUNCEMENT_EXISTED);
        }

        announcementMapper.updateAnnouncement(announcement, request);

        if (announcement.isPublished() && announcement.getPublishedAt() == null) {
            announcement.setPublishedAt(LocalDateTime.now());
        }

        return announcementMapper.toAnnouncementResponse(announcementRepository.save(announcement));
    }

    public void deleteAnnouncement(Long id)
    {
        if(!announcementRepository.existsById(id))
        {
            throw new AppException(ErrorCode.ANNOUNCEMENT_NOT_FOUND);
        }
        announcementRepository.deleteById(id);
    }
}
