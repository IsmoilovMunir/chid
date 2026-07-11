package com.chid.mortgage.dto;

import com.chid.mortgage.calculator.CalculationMode;
import com.chid.mortgage.calculator.MortgageCalculationRequest;
import com.chid.mortgage.calculator.PaymentType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class SaveCalculationRequest {
    @NotNull @Valid
    private MortgageCalculationRequest calculation;
    private Long clientId;
    private String title;
    private String comment;
    private CalculationMode mode;
    private PaymentType paymentType;
}
