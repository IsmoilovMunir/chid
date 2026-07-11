package com.chid.mortgage.config;

import com.chid.mortgage.entity.User;
import com.chid.mortgage.entity.UserRole;
import com.chid.mortgage.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
@RequiredArgsConstructor
@Slf4j
public class DataInitializer {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Bean
    @Profile("dev")
    CommandLineRunner initDevUsers() {
        return args -> {
            if (!userRepository.existsByEmail("admin@chid.ru")) {
                userRepository.save(User.builder()
                        .email("admin@chid.ru")
                        .passwordHash(passwordEncoder.encode("admin123"))
                        .fullName("Администратор CHID")
                        .role(UserRole.ADMIN)
                        .build());
                log.info("Создан тестовый админ: admin@chid.ru / admin123");
            }

            if (!userRepository.existsByEmail("realtor@chid.ru")) {
                userRepository.save(User.builder()
                        .email("realtor@chid.ru")
                        .passwordHash(passwordEncoder.encode("realtor123"))
                        .fullName("Риелтор CHID")
                        .role(UserRole.REALTOR)
                        .build());
                log.info("Создан тестовый риелтор: realtor@chid.ru / realtor123");
            }
        };
    }
}
