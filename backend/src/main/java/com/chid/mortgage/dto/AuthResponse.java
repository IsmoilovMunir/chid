package com.chid.mortgage.dto;

import com.chid.mortgage.entity.UserRole;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AuthResponse {
    private String token;
    private String email;
    private String fullName;
    private UserRole role;
}
