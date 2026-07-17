package com.chid.mortgage.controller;

import com.chid.mortgage.dto.AuthResponse;
import com.chid.mortgage.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/me")
@RequiredArgsConstructor
public class MeController {

    private final AuthService authService;

    @GetMapping
    public ResponseEntity<AuthResponse> me() {
        return ResponseEntity.ok(authService.me());
    }
}
