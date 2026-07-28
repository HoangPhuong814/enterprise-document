FROM eclipse-temurin:17-jre-alpine

LABEL maintainer="DocumentHub"

WORKDIR /app

COPY target/*.jar document-hub.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]

