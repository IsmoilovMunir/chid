package com.chid.mortgage.controller;

import com.chid.mortgage.dto.RealtorUserResponse;
import com.chid.mortgage.service.BrokerService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/brokers")
@RequiredArgsConstructor
public class BrokerController {

    private final BrokerService brokerService;

    @GetMapping
    public ResponseEntity<List<RealtorUserResponse>> listBrokers() {
        return ResponseEntity.ok(brokerService.listActiveBrokers());
    }
}
