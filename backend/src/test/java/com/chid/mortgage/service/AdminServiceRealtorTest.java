package com.chid.mortgage.service;

import com.chid.mortgage.dto.CreateRealtorRequest;
import com.chid.mortgage.entity.User;
import com.chid.mortgage.entity.UserRole;
import com.chid.mortgage.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
@ActiveProfiles("dev")
@Transactional
class AdminServiceRealtorTest {

    @Autowired
    private AdminService adminService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Test
    void createRealtor_registersUserWithRealtorRole() {
        CreateRealtorRequest request = new CreateRealtorRequest();
        request.setFullName("Иванов Иван");
        request.setPhone("+7 900 111-22-33");
        request.setEmail("new-realtor-test@chid.ru");
        request.setPassword("secret12");
        request.setRealtor(true);
        request.setBroker(false);

        var response = adminService.createRealtor(request);

        assertEquals("Иванов Иван", response.getFullName());
        assertEquals("new-realtor-test@chid.ru", response.getEmail());
        assertTrue(response.isRealtor());

        User saved = userRepository.findByEmail("new-realtor-test@chid.ru").orElseThrow();
        assertEquals(UserRole.REALTOR, saved.getRole());
        assertTrue(saved.isRealtor());
        assertEquals("+7 900 111-22-33", saved.getPhone());
        assertTrue(passwordEncoder.matches("secret12", saved.getPasswordHash()));
        assertNotNull(saved.getCreatedAt());
    }
}
