package com.chid.mortgage.dto;

import com.chid.mortgage.calculator.MortgageCalculationResponse;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;

@Data
@Builder
public class CalculationDetailResponse {
    private Long id;
    private Long clientId;
    private String clientName;
    private String title;
    private String propertyUrl;
    private String comment;
    private String publicToken;
    private Instant createdAt;
    private Long brokerUserId;
    private String brokerName;
    private MortgageCalculationResponse result;
}
