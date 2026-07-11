package com.chid.mortgage.controller;

import com.chid.mortgage.dto.CalculationSummaryResponse;
import com.chid.mortgage.dto.ClientRequest;
import com.chid.mortgage.dto.ClientResponse;
import com.chid.mortgage.service.CalculationService;
import com.chid.mortgage.service.ClientService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/clients")
@RequiredArgsConstructor
public class ClientController {

    private final ClientService clientService;
    private final CalculationService calculationService;

    @GetMapping
    public ResponseEntity<List<ClientResponse>> findAll(@RequestParam(required = false) String search) {
        return ResponseEntity.ok(clientService.findAll(search));
    }

    @GetMapping("/{id}/calculations")
    public ResponseEntity<List<CalculationSummaryResponse>> findCalculationsByClient(@PathVariable Long id) {
        return ResponseEntity.ok(calculationService.findByClientId(id));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ClientResponse> findById(@PathVariable Long id) {
        return ResponseEntity.ok(clientService.findById(id));
    }

    @PostMapping
    public ResponseEntity<ClientResponse> create(@Valid @RequestBody ClientRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(clientService.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ClientResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody ClientRequest request
    ) {
        return ResponseEntity.ok(clientService.update(id, request));
    }
}
