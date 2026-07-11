package com.chid.mortgage.calculator;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class MortgageCalculationRequest {

    @NotNull
    private CalculationMode mode;

    private BigDecimal propertyPrice;

    private BigDecimal downPayment;

  /** PERCENT or AMOUNT */
    private String downPaymentType = "AMOUNT";

    @DecimalMin("0.01")
    private BigDecimal loanAmount;

    @Min(1)
    private Integer termMonths;

    @DecimalMin("0.01")
    private BigDecimal monthlyPayment;

    @NotNull
    @DecimalMin("0")
    private BigDecimal interestRate;

    @NotNull
    private PaymentType paymentType;
}
