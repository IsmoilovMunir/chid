package com.chid.mortgage.calculator;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/calculator")
@RequiredArgsConstructor
public class CalculatorController {

    private final MortgageCalculatorService calculatorService;

    @PostMapping("/calculate")
    public ResponseEntity<MortgageCalculationResponse> calculate(
            @Valid @RequestBody MortgageCalculationRequest request
    ) {
        return ResponseEntity.ok(calculatorService.calculate(request));
    }
}
