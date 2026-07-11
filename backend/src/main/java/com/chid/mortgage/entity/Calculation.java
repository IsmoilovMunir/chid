package com.chid.mortgage.entity;

import com.chid.mortgage.calculator.CalculationMode;
import com.chid.mortgage.calculator.PaymentType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "calculations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Calculation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "client_id")
    private Client client;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by_user_id")
    private User createdBy;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CalculationMode mode;

    private BigDecimal propertyPrice;
    private BigDecimal downPayment;

    @Column(nullable = false)
    private BigDecimal loanAmount;

    private BigDecimal baseLoanAmount;
    private BigDecimal discountAmount;
    private BigDecimal discountPercent;

    @Column(nullable = false)
    private Integer termMonths;

    @Column(nullable = false)
    private BigDecimal interestRate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PaymentType paymentType;

    private BigDecimal resultMonthlyPayment;
    private BigDecimal resultTotalInterest;
    private BigDecimal resultOverpayment;

  /** JSON schedule stored as text */
    @Column(columnDefinition = "TEXT")
    private String scheduleJson;

    private String title;

    @Column(length = 2000)
    private String propertyUrl;

    @Column(length = 500)
    private String comment;

    @Column(unique = true)
    private String publicToken;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private Instant createdAt;
}
