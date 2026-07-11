package com.chid.mortgage.calculator;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
public class MortgageCalculationResponse {

    private CalculationMode mode;
    private PaymentType paymentType;

    private BigDecimal propertyPrice;
    private BigDecimal downPayment;
    private BigDecimal loanAmount;
    private Integer termMonths;
    private BigDecimal interestRate;

    /** Сумма кредита до скидки (договор с ЖК) */
    private BigDecimal baseLoanAmount;
    private BigDecimal discountAmount;
    private BigDecimal discountPercent;

    private BigDecimal monthlyPayment;
    private BigDecimal firstMonthlyPayment;
    private BigDecimal lastMonthlyPayment;
    private BigDecimal totalInterest;
    private BigDecimal totalPayment;
    private BigDecimal overpayment;

    private List<PaymentScheduleRow> schedule;
}
