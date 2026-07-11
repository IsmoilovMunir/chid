package com.chid.mortgage.dto;

import com.chid.mortgage.calculator.CalculationMode;
import com.chid.mortgage.calculator.MortgageCalculationRequest;
import com.chid.mortgage.calculator.PaymentType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class SaveCalculationRequest {
    @NotNull @Valid
    private MortgageCalculationRequest calculation;
    private Long clientId;
    private String title;
    private String propertyUrl;
    private String comment;
    private BigDecimal baseLoanAmount;
    private BigDecimal discountAmount;
    private BigDecimal discountPercent;
    private CalculationMode mode;
    private PaymentType paymentType;
}
