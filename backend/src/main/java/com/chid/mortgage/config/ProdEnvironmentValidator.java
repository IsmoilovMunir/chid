package com.chid.mortgage.config;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

@Configuration
@Profile("prod")
@RequiredArgsConstructor
public class ProdEnvironmentValidator {

    @Value("${app.jwt.secret}")
    private String jwtSecret;

    @Value("${spring.datasource.url}")
    private String databaseUrl;

    @Value("${spring.datasource.password}")
    private String databasePassword;

    @PostConstruct
    void validate() {
        if (jwtSecret == null || jwtSecret.isBlank() || jwtSecret.length() < 32) {
            throw new IllegalStateException(
                    "JWT_SECRET must be set in production and be at least 32 characters");
        }
        if (jwtSecret.contains("change-in-production") || jwtSecret.contains("dev-secret")) {
            throw new IllegalStateException("JWT_SECRET must not use the development default value");
        }
        if (databaseUrl == null || databaseUrl.isBlank()) {
            throw new IllegalStateException("DATABASE_URL must be set in production");
        }
        if (databasePassword == null || databasePassword.isBlank() || "chid".equals(databasePassword)) {
            throw new IllegalStateException(
                    "DATABASE_PASSWORD must be set in production and must not be the default 'chid'");
        }
    }
}
