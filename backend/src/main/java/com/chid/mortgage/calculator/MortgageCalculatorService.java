package com.chid.mortgage.calculator;

import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.MathContext;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;

@Service
public class MortgageCalculatorService {

    private static final MathContext MC = new MathContext(20, RoundingMode.HALF_UP);
    private static final int SCALE = 2;

    public MortgageCalculationResponse calculate(MortgageCalculationRequest request) {
        BigDecimal loanAmount = resolveLoanAmount(request);
        int termMonths = resolveTermMonths(request, loanAmount);
        BigDecimal monthlyRate = monthlyRate(request.getInterestRate());

        return switch (request.getMode()) {
            case PAYMENT -> calculatePayment(request, loanAmount, termMonths, monthlyRate);
            case TERM -> calculateTerm(request, loanAmount, monthlyRate);
            case AMOUNT -> calculateAmount(request, termMonths, monthlyRate);
        };
    }

    private MortgageCalculationResponse calculatePayment(
            MortgageCalculationRequest request,
            BigDecimal loanAmount,
            int termMonths,
            BigDecimal monthlyRate
    ) {
        List<PaymentScheduleRow> schedule = buildSchedule(
                loanAmount, termMonths, monthlyRate, request.getPaymentType()
        );
        return buildResponse(request, loanAmount, termMonths, schedule);
    }

    private MortgageCalculationResponse calculateTerm(
            MortgageCalculationRequest request,
            BigDecimal loanAmount,
            BigDecimal monthlyRate
    ) {
        if (request.getMonthlyPayment() == null) {
            throw new IllegalArgumentException("Ежемесячный платёж обязателен для режима TERM");
        }

        int termMonths = estimateTermMonths(
                loanAmount,
                request.getMonthlyPayment(),
                monthlyRate,
                request.getPaymentType()
        );

        List<PaymentScheduleRow> schedule = buildSchedule(
                loanAmount, termMonths, monthlyRate, request.getPaymentType()
        );
        return buildResponse(request, loanAmount, termMonths, schedule);
    }

    private MortgageCalculationResponse calculateAmount(
            MortgageCalculationRequest request,
            int termMonths,
            BigDecimal monthlyRate
    ) {
        if (request.getMonthlyPayment() == null) {
            throw new IllegalArgumentException("Ежемесячный платёж обязателен для режима AMOUNT");
        }

        BigDecimal loanAmount = estimateLoanAmount(
                request.getMonthlyPayment(),
                termMonths,
                monthlyRate,
                request.getPaymentType()
        );

        List<PaymentScheduleRow> schedule = buildSchedule(
                loanAmount, termMonths, monthlyRate, request.getPaymentType()
        );
        return buildResponse(request, loanAmount, termMonths, schedule);
    }

    private BigDecimal resolveLoanAmount(MortgageCalculationRequest request) {
        if (request.getPropertyPrice() != null) {
            BigDecimal downPayment = request.getDownPayment() != null ? request.getDownPayment() : BigDecimal.ZERO;
            if ("PERCENT".equalsIgnoreCase(request.getDownPaymentType())) {
                downPayment = request.getPropertyPrice()
                        .multiply(downPayment)
                        .divide(BigDecimal.valueOf(100), MC);
            }
            BigDecimal loan = request.getPropertyPrice().subtract(downPayment).setScale(SCALE, RoundingMode.HALF_UP);
            if (loan.compareTo(BigDecimal.ZERO) < 0) {
                throw new IllegalArgumentException("Первоначальный взнос не может быть больше стоимости недвижимости");
            }
            return loan;
        }
        if (request.getLoanAmount() != null && request.getLoanAmount().compareTo(BigDecimal.ZERO) > 0) {
            return request.getLoanAmount();
        }
        throw new IllegalArgumentException("Укажите сумму кредита или стоимость недвижимости");
    }

    private int resolveTermMonths(MortgageCalculationRequest request, BigDecimal loanAmount) {
        if (request.getTermMonths() != null) {
            return request.getTermMonths();
        }
        if (request.getMode() == CalculationMode.TERM) {
            return estimateTermMonths(
                    loanAmount,
                    request.getMonthlyPayment(),
                    monthlyRate(request.getInterestRate()),
                    request.getPaymentType()
            );
        }
        throw new IllegalArgumentException("Срок кредита обязателен");
    }

    private List<PaymentScheduleRow> buildSchedule(
            BigDecimal loanAmount,
            int termMonths,
            BigDecimal monthlyRate,
            PaymentType paymentType
    ) {
        return paymentType == PaymentType.ANNUITY
                ? buildAnnuitySchedule(loanAmount, termMonths, monthlyRate)
                : buildDifferentiatedSchedule(loanAmount, termMonths, monthlyRate);
    }

    private List<PaymentScheduleRow> buildAnnuitySchedule(
            BigDecimal loanAmount,
            int termMonths,
            BigDecimal monthlyRate
    ) {
        BigDecimal payment = annuityPayment(loanAmount, termMonths, monthlyRate);
        List<PaymentScheduleRow> schedule = new ArrayList<>();
        BigDecimal balance = loanAmount;

        for (int month = 1; month <= termMonths; month++) {
            BigDecimal interest = balance.multiply(monthlyRate, MC).setScale(SCALE, RoundingMode.HALF_UP);
            BigDecimal principal = payment.subtract(interest).setScale(SCALE, RoundingMode.HALF_UP);

            if (month == termMonths) {
                principal = balance;
                payment = principal.add(interest);
            }

            balance = balance.subtract(principal).max(BigDecimal.ZERO);

            schedule.add(PaymentScheduleRow.builder()
                    .month(month)
                    .payment(payment)
                    .principal(principal)
                    .interest(interest)
                    .remainingBalance(balance.setScale(SCALE, RoundingMode.HALF_UP))
                    .build());
        }

        return schedule;
    }

    private List<PaymentScheduleRow> buildDifferentiatedSchedule(
            BigDecimal loanAmount,
            int termMonths,
            BigDecimal monthlyRate
    ) {
        BigDecimal principalPart = loanAmount.divide(BigDecimal.valueOf(termMonths), MC);
        List<PaymentScheduleRow> schedule = new ArrayList<>();
        BigDecimal balance = loanAmount;

        for (int month = 1; month <= termMonths; month++) {
            BigDecimal interest = balance.multiply(monthlyRate, MC).setScale(SCALE, RoundingMode.HALF_UP);
            BigDecimal principal = principalPart.setScale(SCALE, RoundingMode.HALF_UP);
            BigDecimal payment = principal.add(interest);

            balance = balance.subtract(principal).max(BigDecimal.ZERO);

            schedule.add(PaymentScheduleRow.builder()
                    .month(month)
                    .payment(payment)
                    .principal(principal)
                    .interest(interest)
                    .remainingBalance(balance.setScale(SCALE, RoundingMode.HALF_UP))
                    .build());
        }

        return schedule;
    }

    private BigDecimal annuityPayment(BigDecimal loanAmount, int termMonths, BigDecimal monthlyRate) {
        if (monthlyRate.compareTo(BigDecimal.ZERO) == 0) {
            return loanAmount.divide(BigDecimal.valueOf(termMonths), SCALE, RoundingMode.HALF_UP);
        }

        BigDecimal onePlusRate = BigDecimal.ONE.add(monthlyRate);
        BigDecimal pow = onePlusRate.pow(termMonths, MC);
        BigDecimal numerator = loanAmount.multiply(monthlyRate, MC).multiply(pow, MC);
        BigDecimal denominator = pow.subtract(BigDecimal.ONE, MC);

        return numerator.divide(denominator, SCALE, RoundingMode.HALF_UP);
    }

    private int estimateTermMonths(
            BigDecimal loanAmount,
            BigDecimal targetPayment,
            BigDecimal monthlyRate,
            PaymentType paymentType
    ) {
        int months = 1;
        while (months <= 600) {
            List<PaymentScheduleRow> schedule = buildSchedule(loanAmount, months, monthlyRate, paymentType);
            BigDecimal firstPayment = schedule.getFirst().getPayment();
            if (firstPayment.compareTo(targetPayment) <= 0) {
                return months;
            }
            months++;
        }
        throw new IllegalArgumentException("Не удалось подобрать срок кредита для указанного платежа");
    }

    private BigDecimal estimateLoanAmount(
            BigDecimal targetPayment,
            int termMonths,
            BigDecimal monthlyRate,
            PaymentType paymentType
    ) {
        BigDecimal low = BigDecimal.ONE;
        BigDecimal high = BigDecimal.valueOf(100_000_000);

        for (int i = 0; i < 100; i++) {
            BigDecimal mid = low.add(high).divide(BigDecimal.valueOf(2), MC);
            List<PaymentScheduleRow> schedule = buildSchedule(mid, termMonths, monthlyRate, paymentType);
            BigDecimal firstPayment = schedule.getFirst().getPayment();

            if (firstPayment.compareTo(targetPayment) > 0) {
                high = mid;
            } else {
                low = mid;
            }
        }

        return low.setScale(SCALE, RoundingMode.HALF_UP);
    }

    private MortgageCalculationResponse buildResponse(
            MortgageCalculationRequest request,
            BigDecimal loanAmount,
            int termMonths,
            List<PaymentScheduleRow> schedule
    ) {
        BigDecimal totalInterest = schedule.stream()
                .map(PaymentScheduleRow::getInterest)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(SCALE, RoundingMode.HALF_UP);

        BigDecimal totalPayment = loanAmount.add(totalInterest).setScale(SCALE, RoundingMode.HALF_UP);
        BigDecimal firstPayment = schedule.getFirst().getPayment();
        BigDecimal lastPayment = schedule.getLast().getPayment();

        BigDecimal monthlyPayment = request.getPaymentType() == PaymentType.ANNUITY
                ? firstPayment
                : null;

        return MortgageCalculationResponse.builder()
                .mode(request.getMode())
                .paymentType(request.getPaymentType())
                .propertyPrice(request.getPropertyPrice())
                .downPayment(request.getDownPayment())
                .loanAmount(loanAmount)
                .termMonths(termMonths)
                .interestRate(request.getInterestRate())
                .monthlyPayment(monthlyPayment)
                .firstMonthlyPayment(firstPayment)
                .lastMonthlyPayment(lastPayment)
                .totalInterest(totalInterest)
                .totalPayment(totalPayment)
                .overpayment(totalInterest)
                .schedule(schedule)
                .build();
    }

    private BigDecimal monthlyRate(BigDecimal annualRate) {
        return annualRate
                .divide(BigDecimal.valueOf(100), MC)
                .divide(BigDecimal.valueOf(12), MC);
    }
}
