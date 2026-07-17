package com.chid.mortgage.dto;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;

@Data
@Builder
public class RealtorUserResponse {

    private Long id;
    private String fullName;
    private String phone;
    private String email;
    private Instant createdAt;
    private boolean active;
    private boolean realtor;
    private boolean broker;
    private long clientsCount;
}
