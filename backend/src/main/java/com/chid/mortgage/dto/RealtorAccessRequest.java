package com.chid.mortgage.dto;

import lombok.Data;

@Data
public class RealtorAccessRequest {
    private boolean active;
    private Long reassignToUserId;
}
