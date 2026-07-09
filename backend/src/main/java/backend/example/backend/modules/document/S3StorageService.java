package backend.example.backend.modules.document;

import backend.example.backend.common.exception.AppException;
import backend.example.backend.common.exception.ErrorCode;
import backend.example.backend.modules.user.User;
import backend.example.backend.modules.user.UserRepository;
import com.amazonaws.services.s3.AmazonS3;
import com.amazonaws.services.s3.model.ObjectMetadata;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.experimental.NonFinal;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class S3StorageService {
    AmazonS3 amazonS3;
    DocumentRepository documentRepository;
    UserRepository userRepository;

    @Value("${aws.s3.bucket-name}")
    @NonFinal
    String bucketName;

    @Transactional
    public Document uploadDocument(MultipartFile file, String uploaderEmail) {
        User user = userRepository.findByEmail(uploaderEmail)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        String originalFileName = file.getOriginalFilename();
        String uniqueFileName = UUID.randomUUID() + "_" + originalFileName;

        ObjectMetadata metadata = new ObjectMetadata();
        metadata.setContentLength(file.getSize());
        metadata.setContentType(file.getContentType());

        try {
            amazonS3.putObject(bucketName, uniqueFileName, file.getInputStream(), metadata);
            String fileUrl = amazonS3.getUrl(bucketName, uniqueFileName).toString();

            Document document = Document.builder()
                    .fileName(originalFileName)
                    .fileType(file.getContentType())
                    .fileSize(file.getSize())
                    .s3Url(fileUrl)
                    .uploader(user)
                    .build();
            return documentRepository.save(document);

        } catch (IOException e) {
            log.info("Error in doc s3: " + e);
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
        }
    }
}
