package com.chid.mortgage.service;

import com.chid.mortgage.dto.CreateRealtorRequest;
import com.chid.mortgage.dto.RealtorAccessRequest;
import com.chid.mortgage.calculator.CalculationMode;
import com.chid.mortgage.calculator.PaymentType;
import com.chid.mortgage.entity.Calculation;
import com.chid.mortgage.entity.Client;
import com.chid.mortgage.entity.User;
import com.chid.mortgage.repository.CalculationRepository;
import com.chid.mortgage.repository.ClientRepository;
import com.chid.mortgage.repository.UserRepository;

import java.math.BigDecimal;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
@ActiveProfiles("dev")
@Transactional
class AdminServiceRealtorAccessTest {

    @Autowired
    private AdminService adminService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ClientRepository clientRepository;

    @Autowired
    private CalculationRepository calculationRepository;

    @Test
    void deactivateRealtor_reassignsClientsAndBlocksAccess() {
        User leaving = createRealtorUser("leaving@chid.ru", "Уходящий Риелтор");
        User successor = createRealtorUser("successor@chid.ru", "Новый Риелтор");

        Client client = clientRepository.save(Client.builder()
                .fullName("Клиент 1")
                .phone("+79001111111")
                .source(com.chid.mortgage.entity.ClientSource.CALL)
                .status(com.chid.mortgage.entity.ClientStatus.NEW)
                .assignedUser(leaving)
                .build());

        calculationRepository.save(Calculation.builder()
                .client(client)
                .createdBy(leaving)
                .mode(CalculationMode.PAYMENT)
                .loanAmount(new BigDecimal("3000000"))
                .termMonths(240)
                .interestRate(new BigDecimal("12.5"))
                .paymentType(PaymentType.ANNUITY)
                .build());

        RealtorAccessRequest request = new RealtorAccessRequest();
        request.setActive(false);
        request.setReassignToUserId(successor.getId());

        var response = adminService.updateRealtorAccess(leaving.getId(), request);

        assertFalse(response.isActive());
        assertEquals(0, response.getClientsCount());
        assertEquals(1, clientRepository.countByAssignedUser(successor));
        assertEquals(successor.getId(),
                calculationRepository.findByClientOrderByCreatedAtDesc(client).getFirst().getCreatedBy().getId());
        assertFalse(userRepository.findById(leaving.getId()).orElseThrow().isActive());
    }

    @Test
    void deactivateRealtor_withClients_requiresReassignTarget() {
        User leaving = createRealtorUser("blocked@chid.ru", "Риелтор с клиентами");
        clientRepository.save(Client.builder()
                .fullName("Клиент 2")
                .phone("+79002222222")
                .source(com.chid.mortgage.entity.ClientSource.CALL)
                .status(com.chid.mortgage.entity.ClientStatus.NEW)
                .assignedUser(leaving)
                .build());

        RealtorAccessRequest request = new RealtorAccessRequest();
        request.setActive(false);

        assertThrows(IllegalArgumentException.class,
                () -> adminService.updateRealtorAccess(leaving.getId(), request));
    }

    @Test
    void reactivateRealtor_restoresAccess() {
        User realtor = createRealtorUser("returning@chid.ru", "Вернувшийся Риелтор");
        realtor.setActive(false);
        userRepository.save(realtor);

        RealtorAccessRequest request = new RealtorAccessRequest();
        request.setActive(true);

        var response = adminService.updateRealtorAccess(realtor.getId(), request);

        assertTrue(response.isActive());
        assertTrue(userRepository.findById(realtor.getId()).orElseThrow().isActive());
    }

    private User createRealtorUser(String email, String fullName) {
        CreateRealtorRequest request = new CreateRealtorRequest();
        request.setFullName(fullName);
        request.setPhone("+7 900 000-00-00");
        request.setEmail(email);
        request.setPassword("secret12");
        adminService.createRealtor(request);
        return userRepository.findByEmail(email).orElseThrow();
    }
}
