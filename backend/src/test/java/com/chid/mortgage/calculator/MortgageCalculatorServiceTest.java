package com.chid.mortgage.calculator;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class MortgageCalculatorServiceTest {

    private final MortgageCalculatorService service = new MortgageCalculatorService();

    @Test
    void annuityPayment_matchesCalcusReference() {
        MortgageCalculationRequest request = new MortgageCalculationRequest();
        request.setMode(CalculationMode.PAYMENT);
        request.setLoanAmount(new BigDecimal("2000000"));
        request.setTermMonths(120);
        request.setInterestRate(new BigDecimal("12"));
        request.setPaymentType(PaymentType.ANNUITY);

        MortgageCalculationResponse response = service.calculate(request);

        assertEquals(0, response.getMonthlyPayment().compareTo(new BigDecimal("28694.19")));
        assertEquals(0, response.getOverpayment().compareTo(new BigDecimal("1443302.78")));
    }

    @Test
    void loanAmount_computedFromPropertyPriceAndDownPayment() {
        MortgageCalculationRequest request = new MortgageCalculationRequest();
        request.setMode(CalculationMode.PAYMENT);
        request.setPropertyPrice(new BigDecimal("1233333"));
        request.setDownPayment(new BigDecimal("1000000"));
        request.setDownPaymentType("AMOUNT");
        request.setLoanAmount(BigDecimal.ZERO);
        request.setTermMonths(240);
        request.setInterestRate(new BigDecimal("12"));
        request.setPaymentType(PaymentType.ANNUITY);

        MortgageCalculationResponse response = service.calculate(request);

        assertEquals(0, response.getLoanAmount().compareTo(new BigDecimal("233333")));
    }

    @Test
    void loanAmount_computedFromPercentDownPayment() {
        MortgageCalculationRequest request = new MortgageCalculationRequest();
        request.setMode(CalculationMode.PAYMENT);
        request.setPropertyPrice(new BigDecimal("10000000"));
        request.setDownPayment(new BigDecimal("20"));
        request.setDownPaymentType("PERCENT");
        request.setTermMonths(240);
        request.setInterestRate(new BigDecimal("12"));
        request.setPaymentType(PaymentType.ANNUITY);

        MortgageCalculationResponse response = service.calculate(request);

        assertEquals(0, response.getLoanAmount().compareTo(new BigDecimal("8000000")));
    }

    @Test
    void loanAmount_prefersExplicitAmountOverPropertyPrice() {
        MortgageCalculationRequest request = new MortgageCalculationRequest();
        request.setMode(CalculationMode.PAYMENT);
        request.setPropertyPrice(new BigDecimal("16770000"));
        request.setDownPayment(new BigDecimal("3354000"));
        request.setDownPaymentType("AMOUNT");
        request.setLoanAmount(new BigDecimal("12074400"));
        request.setTermMonths(240);
        request.setInterestRate(new BigDecimal("20"));
        request.setPaymentType(PaymentType.ANNUITY);

        MortgageCalculationResponse response = service.calculate(request);

        assertEquals(0, response.getLoanAmount().compareTo(new BigDecimal("12074400")));
    }

    @Test
    void loanAmount_rejectsDownPaymentGreaterThanPrice() {
        MortgageCalculationRequest request = new MortgageCalculationRequest();
        request.setMode(CalculationMode.PAYMENT);
        request.setPropertyPrice(new BigDecimal("1000000"));
        request.setDownPayment(new BigDecimal("2000000"));
        request.setDownPaymentType("AMOUNT");
        request.setTermMonths(120);
        request.setInterestRate(new BigDecimal("12"));
        request.setPaymentType(PaymentType.ANNUITY);

        assertThrows(IllegalArgumentException.class, () -> service.calculate(request));
    }
}
