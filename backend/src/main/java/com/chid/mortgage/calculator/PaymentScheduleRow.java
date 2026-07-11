package com.chid.mortgage.calculator;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class PaymentScheduleRow {

    private int month;
    private BigDecimal payment;
    private BigDecimal principal;
    private BigDecimal interest;
    private BigDecimal remainingBalance;
}
