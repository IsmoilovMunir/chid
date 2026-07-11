package com.chid.mortgage.calculator;

import java.math.BigDecimal;
import java.math.RoundingMode;

public final class LoanDiscount {

    private LoanDiscount() {
    }

    public static BigDecimal apply(BigDecimal baseLoan, BigDecimal discountAmount, BigDecimal discountPercent) {
        if (baseLoan == null || baseLoan.compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.ZERO;
        }

        BigDecimal rubDiscount = discountAmount != null ? discountAmount : BigDecimal.ZERO;
        BigDecimal percent = discountPercent != null ? discountPercent : BigDecimal.ZERO;

        BigDecimal percentDiscount = baseLoan
                .multiply(percent)
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);

        BigDecimal result = baseLoan.subtract(rubDiscount).subtract(percentDiscount);
        return result.compareTo(BigDecimal.ZERO) < 0 ? BigDecimal.ZERO : result.setScale(2, RoundingMode.HALF_UP);
    }

    public static boolean hasDiscount(BigDecimal discountAmount, BigDecimal discountPercent) {
        return (discountAmount != null && discountAmount.compareTo(BigDecimal.ZERO) > 0)
                || (discountPercent != null && discountPercent.compareTo(BigDecimal.ZERO) > 0);
    }
}
