package com.chid.mortgage.config;

import com.chid.mortgage.entity.User;
import com.chid.mortgage.entity.UserRole;
import com.chid.mortgage.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.util.StringUtils;

@Configuration
@RequiredArgsConstructor
@Slf4j
public class ProdAdminBootstrap {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.admin.bootstrap-email:}")
    private String bootstrapEmail;

    @Value("${app.admin.bootstrap-password:}")
    private String bootstrapPassword;

    @Value("${app.admin.bootstrap-full-name:Администратор CHID}")
    private String bootstrapFullName;

    @Bean
    @Profile("prod")
    CommandLineRunner bootstrapAdmin() {
        return args -> {
            if (!StringUtils.hasText(bootstrapEmail) || !StringUtils.hasText(bootstrapPassword)) {
                if (userRepository.findAll().stream().noneMatch(u -> u.getRole() == UserRole.ADMIN)) {
                    log.warn("No ADMIN users and ADMIN_EMAIL/ADMIN_PASSWORD not set — create an admin manually");
                }
                return;
            }

            if (userRepository.existsByEmail(bootstrapEmail.trim().toLowerCase())) {
                log.info("Admin bootstrap skipped: user {} already exists", bootstrapEmail);
                return;
            }

            if (bootstrapPassword.length() < 10) {
                throw new IllegalStateException("ADMIN_PASSWORD must be at least 10 characters");
            }

            userRepository.save(User.builder()
                    .email(bootstrapEmail.trim().toLowerCase())
                    .passwordHash(passwordEncoder.encode(bootstrapPassword))
                    .fullName(bootstrapFullName.trim())
                    .role(UserRole.ADMIN)
                    .realtor(false)
                    .broker(false)
                    .active(true)
                    .build());

            log.info("Created production admin user: {}", bootstrapEmail.trim().toLowerCase());
        };
    }
}
