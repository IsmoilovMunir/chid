package com.chid.mortgage.dto;

import com.chid.mortgage.entity.ClientSource;
import com.chid.mortgage.entity.ClientStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ClientRequest {
    @NotBlank
    private String fullName;
    @NotBlank
    private String phone;
    private String email;
    @NotNull
    private ClientSource source;
    @NotNull
    private ClientStatus status;
    private String comment;
    private Long assignedUserId;
    private Long brokerUserId;
}
