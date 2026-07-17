package com.chid.mortgage.dto;

import com.chid.mortgage.entity.ClientSource;
import com.chid.mortgage.entity.ClientStatus;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;

@Data
@Builder
public class ClientResponse {
    private Long id;
    private String fullName;
    private String phone;
    private String email;
    private ClientSource source;
    private ClientStatus status;
    private String comment;
    private Long assignedUserId;
    private String assignedUserName;
    private Long brokerUserId;
    private String brokerName;
    private Instant createdAt;
    private Instant updatedAt;
}
