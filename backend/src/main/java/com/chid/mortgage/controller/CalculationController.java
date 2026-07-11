package com.chid.mortgage.controller;

import com.chid.mortgage.dto.CalculationDetailResponse;
import com.chid.mortgage.dto.PublicCalculationResponse;
import com.chid.mortgage.dto.CalculationSummaryResponse;
import com.chid.mortgage.dto.SaveCalculationRequest;
import com.chid.mortgage.service.CalculationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/calculations")
@RequiredArgsConstructor
public class CalculationController {

    private final CalculationService calculationService;

    @GetMapping
    public ResponseEntity<List<CalculationSummaryResponse>> findAll() {
        return ResponseEntity.ok(calculationService.findAll());
    }

    @GetMapping("/public/{token}")
    public ResponseEntity<PublicCalculationResponse> findByPublicToken(@PathVariable String token) {
        return ResponseEntity.ok(calculationService.findByPublicToken(token));
    }

    @GetMapping("/{id}")
    public ResponseEntity<CalculationDetailResponse> findById(@PathVariable Long id) {
        return ResponseEntity.ok(calculationService.findById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<CalculationSummaryResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody SaveCalculationRequest request
    ) {
        return ResponseEntity.ok(calculationService.update(id, request));
    }

    @PostMapping
    public ResponseEntity<CalculationSummaryResponse> save(@Valid @RequestBody SaveCalculationRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(calculationService.save(request));
    }
}
