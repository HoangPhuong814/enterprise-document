package backend.example.backend.modules.auth;

import backend.example.backend.common.exception.AppException;
import backend.example.backend.common.exception.ErrorCode;
import backend.example.backend.modules.auth.dto.AuthenticationRequest;
import backend.example.backend.modules.auth.dto.AuthenticationResponse;
import backend.example.backend.modules.auth.dto.IntrospectRequest;
import backend.example.backend.modules.auth.dto.IntrospectResponse;
import backend.example.backend.modules.auth.dto.RefreshRequest;
import backend.example.backend.modules.auth.dto.LogoutRequest;
import backend.example.backend.modules.user.*;
import org.springframework.data.redis.core.StringRedisTemplate;
import java.util.concurrent.TimeUnit;
import com.nimbusds.jose.*;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jose.crypto.MACVerifier;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.experimental.NonFinal;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.text.ParseException;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.StringJoiner;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class AuthenticationService {
    @Value("${jwt.signerKey}")
    @NonFinal
    protected String signerKey;

    UserRepository userRepository;
    StringRedisTemplate stringRedisTemplate;

    public IntrospectResponse introspect(IntrospectRequest request)
    {
        var token = request.getToken();
        boolean isValid = true;

        try {
            verifyToken(token);
        } catch (Exception e) {
            isValid = false;
        }

        return IntrospectResponse.builder()
                .valid(isValid)
                .build();
    }

    private SignedJWT verifyToken(String token) throws JOSEException, ParseException {
        JWSVerifier verifier = new MACVerifier(signerKey.getBytes());
        SignedJWT signedJWT = SignedJWT.parse(token);

        Date expiryTime = signedJWT.getJWTClaimsSet().getExpirationTime();
        var verified = signedJWT.verify(verifier);

        String jit = signedJWT.getJWTClaimsSet().getJWTID();

        if(!verified || expiryTime.before(new Date()) ||
                Boolean.TRUE.equals(stringRedisTemplate.hasKey("blacklist:" + jit)))
        {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }

        return signedJWT;
    }

    public AuthenticationResponse authenticate(AuthenticationRequest request)
    {
        var user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(()-> new AppException(ErrorCode.USER_NOT_EXISTED));

        if(request.getPassword() == null || request.getPassword().trim().isEmpty())
        {
            throw new AppException(ErrorCode.INVALID_PASSWORD);
        }

        PasswordEncoder passwordEncoder = new BCryptPasswordEncoder(10);

        boolean authenticated = passwordEncoder.matches(request.getPassword(), user.getPassword());

        if (!authenticated)
        {
            throw new AppException(ErrorCode.INVALID_PASSWORD);
        }

        var token = generateToken(user);
        var refreshToken = generateRefreshToken(user);

        try {
            String refreshJti = SignedJWT.parse(refreshToken).getJWTClaimsSet().getJWTID();
            stringRedisTemplate.opsForValue().set(
                "refreshToken:" + refreshJti,
                user.getEmail(),
                24,
                TimeUnit.HOURS
            );
        } catch (ParseException e) {
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
        }

        return AuthenticationResponse.builder()
                .token(token)
                .refreshToken(refreshToken)
                .authenticated(true)
                .build();
    }

    public String generateRefreshToken(User user)
    {
        JWSHeader header = new JWSHeader(JWSAlgorithm.HS512);
        JWTClaimsSet claimsSet = new JWTClaimsSet.Builder()
                .subject(user.getEmail())
                .issuer("docHub")
                .issueTime(new Date())
                .expirationTime(new Date(Instant.now().plus(24, ChronoUnit.HOURS).toEpochMilli()))
                .jwtID(UUID.randomUUID().toString())
                .build();
        Payload payload = new Payload(claimsSet.toJSONObject());

        JWSObject jwsObject = new JWSObject(header, payload);
        try {
            jwsObject.sign(new MACSigner(signerKey.getBytes()));
            return jwsObject.serialize();
        }
        catch (JOSEException e) {
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
        }
    }

    public String generateToken(User user)
    {
        JWSHeader header = new JWSHeader(JWSAlgorithm.HS512);
        JWTClaimsSet claimsSet = new JWTClaimsSet.Builder()
                .subject(user.getEmail())
                .issuer("docHub")
                .issueTime(new Date())
                .expirationTime(new Date(Instant.now().plus(1, ChronoUnit.HOURS).toEpochMilli()))
                .jwtID(UUID.randomUUID().toString())
                .claim("scope", buildScope(user))
                .build();
        Payload payload = new Payload(claimsSet.toJSONObject());

        JWSObject jwsObject = new JWSObject(header, payload);
        try {
            jwsObject.sign(new MACSigner(signerKey.getBytes()));
            return jwsObject.serialize();
        }
        catch (JOSEException e) {
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
        }
    }

    private String buildScope(User user)
    {
        StringJoiner stringJoiner = new StringJoiner(" ");
        if (user.getRoles() != null) {
            for (Role role : user.getRoles()) {
                stringJoiner.add("ROLE_" + role.getName());
                if (role.getPermissions() != null) {
                    for (Permission permission : role.getPermissions()) {
                        stringJoiner.add(permission.getName());
                    }
                }
            }
        }
        return stringJoiner.toString();
    }

    public void logout(LogoutRequest request) {
        try {
            var signedAccessToken = verifyToken(request.getToken());
            String accessJti = signedAccessToken.getJWTClaimsSet().getJWTID();
            Date expiryTime = signedAccessToken.getJWTClaimsSet().getExpirationTime();
            long ttlMillis = expiryTime.getTime() - System.currentTimeMillis();
            if (ttlMillis > 0) {
                stringRedisTemplate.opsForValue().set(
                    "blacklist:" + accessJti,
                    "true",
                    ttlMillis,
                    TimeUnit.MILLISECONDS
                );
            }
        } catch (Exception e) {
            // Access token already invalid/expired, proceed
        }

        try {
            var signedRefreshToken = verifyToken(request.getRefreshToken());
            String refreshJti = signedRefreshToken.getJWTClaimsSet().getJWTID();
            stringRedisTemplate.delete("refreshToken:" + refreshJti);
        } catch (Exception e) {
            // Refresh token already invalid/expired, proceed
        }
    }

    public AuthenticationResponse refreshToken(RefreshRequest request) {
        try {
            var signedRefreshToken = verifyToken(request.getRefreshToken());
            String refreshJti = signedRefreshToken.getJWTClaimsSet().getJWTID();
            String email = signedRefreshToken.getJWTClaimsSet().getSubject();

            String storedEmail = stringRedisTemplate.opsForValue().get("refreshToken:" + refreshJti);
            if (storedEmail == null) {
                throw new AppException(ErrorCode.UNAUTHENTICATED);
            }

            stringRedisTemplate.delete("refreshToken:" + refreshJti);

            var user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

            var newAccessToken = generateToken(user);
            var newRefreshToken = generateRefreshToken(user);

            String newRefreshJti = SignedJWT.parse(newRefreshToken).getJWTClaimsSet().getJWTID();
            stringRedisTemplate.opsForValue().set(
                "refreshToken:" + newRefreshJti,
                user.getEmail(),
                24,
                TimeUnit.HOURS
            );

            return AuthenticationResponse.builder()
                .token(newAccessToken)
                .refreshToken(newRefreshToken)
                .authenticated(true)
                .build();
        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }
    }
}
