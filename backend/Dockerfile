# Stage 1: Build
FROM eclipse-temurin:17-jdk-alpine AS builder

WORKDIR /build

# Copy maven wrapper and pom.xml first for dependency caching
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./
RUN chmod +x mvnw && ./mvnw dependency:go-offline -B

# Copy source code
COPY src/ src/

# If application.yml is gitignored and missing, fallback to application-example.yml
RUN if [ ! -f src/main/resources/application.yml ]; then \
      cp src/main/resources/application-example.yml src/main/resources/application.yml; \
    fi

# Build jar without running unit tests (tests run in CI)
RUN ./mvnw clean package -DskipTests -B

# Stage 2: Runtime
FROM eclipse-temurin:17-jre-alpine

LABEL maintainer="DocumentHub"

WORKDIR /app

COPY --from=builder /build/target/*.jar document-hub.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "document-hub.jar"]
