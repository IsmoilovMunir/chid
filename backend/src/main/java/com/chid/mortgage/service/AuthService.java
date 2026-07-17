package com.chid.mortgage.service;

import com.chid.mortgage.dto.AuthResponse;
import com.chid.mortgage.dto.LoginRequest;
import com.chid.mortgage.entity.User;
import com.chid.mortgage.entity.UserRole;
import com.chid.mortgage.repository.UserRepository;
import com.chid.mortgage.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final JwtService jwtService;

    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new UsernameNotFoundException("Пользователь не найден"));

        var userDetails = org.springframework.security.core.userdetails.User
                .withUsername(user.getEmail())
                .password(user.getPasswordHash())
                .roles(user.getRole().name())
                .build();

        return AuthResponse.builder()
                .id(user.getId())
                .token(jwtService.generateToken(userDetails))
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole())
                .realtor(user.getRole() == UserRole.ADMIN || user.isRealtor())
                .broker(user.isBroker())
                .build();
    }

    public AuthResponse me() {
        String email = org.springframework.security.core.context.SecurityContextHolder
                .getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("Пользователь не найден"));

        return AuthResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole())
                .realtor(user.getRole() == UserRole.ADMIN || user.isRealtor())
                .broker(user.isBroker())
                .build();
    }
}
