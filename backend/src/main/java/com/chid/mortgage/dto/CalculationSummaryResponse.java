package com.chid.mortgage.dto;

import com.chid.mortgage.calculator.CalculationMode;
import com.chid.mortgage.calculator.PaymentType;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;

@Data
@Builder
public class CalculationSummaryResponse {
    private Long id;
    private Long clientId;
    private String clientName;
    private String title;
    private String propertyUrl;
    private CalculationMode mode;
    private PaymentType paymentType;
    private BigDecimal loanAmount;
    private Integer termMonths;
    private BigDecimal interestRate;
    private BigDecimal resultMonthlyPayment;
    private BigDecimal resultOverpayment;
    private String publicToken;
    private Instant createdAt;
    private Long brokerUserId;
    private String brokerName;
}
