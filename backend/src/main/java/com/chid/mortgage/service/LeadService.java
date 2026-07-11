package com.chid.mortgage.service;

import com.chid.mortgage.dto.LeadRequest;
import com.chid.mortgage.entity.Calculation;
import com.chid.mortgage.entity.Client;
import com.chid.mortgage.entity.ClientSource;
import com.chid.mortgage.entity.ClientStatus;
import com.chid.mortgage.entity.Lead;
import com.chid.mortgage.entity.User;
import com.chid.mortgage.entity.UserRole;
import com.chid.mortgage.repository.CalculationRepository;
import com.chid.mortgage.repository.ClientRepository;
import com.chid.mortgage.repository.LeadRepository;
import com.chid.mortgage.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class LeadService {

    private final LeadRepository leadRepository;
    private final CalculationRepository calculationRepository;
    private final ClientRepository clientRepository;
    private final UserRepository userRepository;

    @Transactional
    public void create(LeadRequest request) {
        if (!Boolean.TRUE.equals(request.getConsent())) {
            throw new IllegalArgumentException("Необходимо согласие на обработку персональных данных");
        }

        Calculation calculation = null;
        if (request.getCalculationId() != null) {
            calculation = calculationRepository.findById(request.getCalculationId()).orElse(null);
        }

        leadRepository.save(Lead.builder()
                .name(request.getName())
                .phone(request.getPhone())
                .calculation(calculation)
                .consent(true)
                .build());

        User assignee = userRepository.findAll().stream()
                .filter(u -> u.getRole() == UserRole.ADMIN)
                .findFirst()
                .orElseGet(() -> userRepository.findAll().stream().findFirst().orElse(null));

        if (assignee != null) {
            clientRepository.save(Client.builder()
                    .fullName(request.getName())
                    .phone(request.getPhone())
                    .source(ClientSource.WEBSITE)
                    .status(ClientStatus.NEW)
                    .comment("Заявка с публичной формы")
                    .assignedUser(assignee)
                    .build());
        }
    }
}
