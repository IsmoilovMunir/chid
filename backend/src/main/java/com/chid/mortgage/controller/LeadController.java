package com.chid.mortgage.controller;

import com.chid.mortgage.dto.LeadRequest;
import com.chid.mortgage.service.LeadService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/leads")
@RequiredArgsConstructor
public class LeadController {

    private final LeadService leadService;

    @PostMapping
    public ResponseEntity<Map<String, String>> create(@Valid @RequestBody LeadRequest request) {
        leadService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(Map.of("message", "Заявка принята"));
    }
}
