package com.chid.mortgage.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class LeadRequest {
    @NotBlank
    private String name;
    @NotBlank
    private String phone;
    private Long calculationId;
    @NotNull
    private Boolean consent;
}
