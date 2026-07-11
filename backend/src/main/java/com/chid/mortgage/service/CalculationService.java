package com.chid.mortgage.service;

import com.chid.mortgage.calculator.MortgageCalculationResponse;
import com.chid.mortgage.calculator.MortgageCalculatorService;
import com.chid.mortgage.dto.CalculationSummaryResponse;
import com.chid.mortgage.dto.SaveCalculationRequest;
import com.chid.mortgage.entity.Calculation;
import com.chid.mortgage.entity.Client;
import com.chid.mortgage.entity.User;
import com.chid.mortgage.entity.UserRole;
import com.chid.mortgage.repository.CalculationRepository;
import com.chid.mortgage.repository.UserRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CalculationService {

    private final CalculationRepository calculationRepository;
    private final ClientService clientService;
    private final UserRepository userRepository;
    private final MortgageCalculatorService calculatorService;
    private final ObjectMapper objectMapper;

    @Transactional
    public CalculationSummaryResponse save(SaveCalculationRequest request) {
        MortgageCalculationResponse result = calculatorService.calculate(request.getCalculation());
        User currentUser = getCurrentUser();

        Client client = null;
        if (request.getClientId() != null) {
            client = clientService.getAccessibleClient(request.getClientId());
        }

        Calculation calculation = Calculation.builder()
                .client(client)
                .createdBy(currentUser)
                .mode(result.getMode())
                .propertyPrice(result.getPropertyPrice())
                .downPayment(result.getDownPayment())
                .loanAmount(result.getLoanAmount())
                .termMonths(result.getTermMonths())
                .interestRate(result.getInterestRate())
                .paymentType(result.getPaymentType())
                .resultMonthlyPayment(result.getMonthlyPayment() != null
                        ? result.getMonthlyPayment()
                        : result.getFirstMonthlyPayment())
                .resultTotalInterest(result.getTotalInterest())
                .resultOverpayment(result.getOverpayment())
                .scheduleJson(toJson(result))
                .title(request.getTitle())
                .comment(request.getComment())
                .publicToken(UUID.randomUUID().toString())
                .build();

        return toSummary(calculationRepository.save(calculation));
    }

    @Transactional(readOnly = true)
    public List<CalculationSummaryResponse> findAll() {
        User currentUser = getCurrentUser();
        List<Calculation> calculations = currentUser.getRole() == UserRole.ADMIN
                ? calculationRepository.findAllByOrderByCreatedAtDesc()
                : calculationRepository.findByCreatedByOrderByCreatedAtDesc(currentUser);
        return calculations.stream().map(this::toSummary).toList();
    }

    @Transactional(readOnly = true)
    public MortgageCalculationResponse findByPublicToken(String token) {
        Calculation calculation = calculationRepository.findByPublicToken(token)
                .orElseThrow(() -> new IllegalArgumentException("Расчёт не найден"));
        return fromJson(calculation.getScheduleJson());
    }

    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalStateException("Пользователь не найден"));
    }

    private String toJson(MortgageCalculationResponse response) {
        try {
            return objectMapper.writeValueAsString(response);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Ошибка сериализации расчёта", e);
        }
    }

    private MortgageCalculationResponse fromJson(String json) {
        try {
            return objectMapper.readValue(json, MortgageCalculationResponse.class);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Ошибка десериализации расчёта", e);
        }
    }

    private CalculationSummaryResponse toSummary(Calculation c) {
        return CalculationSummaryResponse.builder()
                .id(c.getId())
                .clientId(c.getClient() != null ? c.getClient().getId() : null)
                .clientName(c.getClient() != null ? c.getClient().getFullName() : null)
                .title(c.getTitle())
                .mode(c.getMode())
                .paymentType(c.getPaymentType())
                .loanAmount(c.getLoanAmount())
                .termMonths(c.getTermMonths())
                .interestRate(c.getInterestRate())
                .resultMonthlyPayment(c.getResultMonthlyPayment())
                .resultOverpayment(c.getResultOverpayment())
                .publicToken(c.getPublicToken())
                .createdAt(c.getCreatedAt())
                .build();
    }
}
