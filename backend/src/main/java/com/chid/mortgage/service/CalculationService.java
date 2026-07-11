package com.chid.mortgage.service;

import com.chid.mortgage.calculator.MortgageCalculationResponse;
import com.chid.mortgage.calculator.MortgageCalculatorService;
import com.chid.mortgage.dto.CalculationDetailResponse;
import com.chid.mortgage.dto.PublicCalculationResponse;
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

import java.math.BigDecimal;
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
        MortgageCalculationResponse result = calculateAndEnrich(request);
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
                .baseLoanAmount(result.getBaseLoanAmount())
                .discountAmount(result.getDiscountAmount())
                .discountPercent(result.getDiscountPercent())
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
                .propertyUrl(request.getPropertyUrl())
                .comment(request.getComment())
                .publicToken(UUID.randomUUID().toString())
                .build();

        return toSummary(calculationRepository.save(calculation));
    }

    @Transactional
    public CalculationSummaryResponse update(Long id, SaveCalculationRequest request) {
        Calculation calculation = getAccessibleCalculation(id);
        MortgageCalculationResponse result = calculateAndEnrich(request);

        Client client = null;
        if (request.getClientId() != null) {
            client = clientService.getAccessibleClient(request.getClientId());
        }

        calculation.setClient(client);
        calculation.setMode(result.getMode());
        calculation.setPropertyPrice(result.getPropertyPrice());
        calculation.setDownPayment(result.getDownPayment());
        calculation.setLoanAmount(result.getLoanAmount());
        calculation.setBaseLoanAmount(result.getBaseLoanAmount());
        calculation.setDiscountAmount(result.getDiscountAmount());
        calculation.setDiscountPercent(result.getDiscountPercent());
        calculation.setTermMonths(result.getTermMonths());
        calculation.setInterestRate(result.getInterestRate());
        calculation.setPaymentType(result.getPaymentType());
        calculation.setResultMonthlyPayment(result.getMonthlyPayment() != null
                ? result.getMonthlyPayment()
                : result.getFirstMonthlyPayment());
        calculation.setResultTotalInterest(result.getTotalInterest());
        calculation.setResultOverpayment(result.getOverpayment());
        calculation.setScheduleJson(toJson(result));
        calculation.setTitle(request.getTitle());
        calculation.setPropertyUrl(request.getPropertyUrl());
        calculation.setComment(request.getComment());

        return toSummary(calculationRepository.save(calculation));
    }

    @Transactional(readOnly = true)
    public CalculationDetailResponse findById(Long id) {
        Calculation calculation = getAccessibleCalculation(id);
        return CalculationDetailResponse.builder()
                .id(calculation.getId())
                .clientId(calculation.getClient() != null ? calculation.getClient().getId() : null)
                .clientName(calculation.getClient() != null ? calculation.getClient().getFullName() : null)
                .title(calculation.getTitle())
                .propertyUrl(calculation.getPropertyUrl())
                .comment(calculation.getComment())
                .publicToken(calculation.getPublicToken())
                .createdAt(calculation.getCreatedAt())
                .result(fromJson(calculation.getScheduleJson()))
                .build();
    }

    @Transactional(readOnly = true)
    public List<CalculationSummaryResponse> findByClientId(Long clientId) {
        Client client = clientService.getAccessibleClient(clientId);
        return calculationRepository.findByClientOrderByCreatedAtDesc(client).stream()
                .map(this::toSummary)
                .toList();
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
    public PublicCalculationResponse findByPublicToken(String token) {
        Calculation calculation = calculationRepository.findByPublicToken(token)
                .orElseThrow(() -> new IllegalArgumentException("Расчёт не найден"));
        return PublicCalculationResponse.builder()
                .clientName(calculation.getClient() != null ? calculation.getClient().getFullName() : null)
                .title(calculation.getTitle())
                .propertyUrl(calculation.getPropertyUrl())
                .result(fromJson(calculation.getScheduleJson()))
                .build();
    }

    private Calculation getAccessibleCalculation(Long id) {
        Calculation calculation = calculationRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Расчёт не найден"));
        User currentUser = getCurrentUser();

        if (currentUser.getRole() != UserRole.ADMIN
                && (calculation.getCreatedBy() == null
                || !calculation.getCreatedBy().getId().equals(currentUser.getId()))) {
            throw new IllegalArgumentException("Нет доступа к расчёту");
        }

        return calculation;
    }

    private MortgageCalculationResponse calculateAndEnrich(SaveCalculationRequest request) {
        MortgageCalculationResponse result = calculatorService.calculate(request.getCalculation());
        enrichWithDiscount(result, request);
        return result;
    }

    private void enrichWithDiscount(MortgageCalculationResponse result, SaveCalculationRequest request) {
        BigDecimal discountAmount = request.getDiscountAmount() != null
                ? request.getDiscountAmount()
                : BigDecimal.ZERO;
        BigDecimal discountPercent = request.getDiscountPercent() != null
                ? request.getDiscountPercent()
                : BigDecimal.ZERO;
        BigDecimal baseLoanAmount = request.getBaseLoanAmount() != null
                ? request.getBaseLoanAmount()
                : result.getLoanAmount();

        result.setBaseLoanAmount(baseLoanAmount);
        result.setDiscountAmount(discountAmount);
        result.setDiscountPercent(discountPercent);
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
                .propertyUrl(c.getPropertyUrl())
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
