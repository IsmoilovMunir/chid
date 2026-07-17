package com.chid.mortgage.controller;

import com.chid.mortgage.dto.AdminDashboardResponse;
import com.chid.mortgage.dto.ClientResponse;
import com.chid.mortgage.dto.CreateRealtorRequest;
import com.chid.mortgage.dto.DeleteRealtorRequest;
import com.chid.mortgage.dto.RealtorAccessRequest;
import com.chid.mortgage.dto.RealtorUserResponse;
import com.chid.mortgage.dto.UpdateRealtorRequest;
import com.chid.mortgage.service.AdminService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;

    @GetMapping("/dashboard")
    public ResponseEntity<AdminDashboardResponse> dashboard() {
        return ResponseEntity.ok(adminService.getDashboard());
    }

    @GetMapping("/realtors")
    public ResponseEntity<List<RealtorUserResponse>> listRealtors(
            @RequestParam(required = false) Boolean activeOnly
    ) {
        return ResponseEntity.ok(adminService.listRealtors(activeOnly));
    }

    @GetMapping("/realtors/{id}/clients")
    public ResponseEntity<List<ClientResponse>> listRealtorClients(@PathVariable Long id) {
        return ResponseEntity.ok(adminService.listRealtorClients(id));
    }

    @PostMapping("/realtors")
    public ResponseEntity<RealtorUserResponse> createRealtor(@Valid @RequestBody CreateRealtorRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(adminService.createRealtor(request));
    }

    @PutMapping("/realtors/{id}")
    public ResponseEntity<RealtorUserResponse> updateRealtor(
            @PathVariable Long id,
            @Valid @RequestBody UpdateRealtorRequest request
    ) {
        return ResponseEntity.ok(adminService.updateRealtor(id, request));
    }

    @PatchMapping("/realtors/{id}/access")
    public ResponseEntity<RealtorUserResponse> updateRealtorAccess(
            @PathVariable Long id,
            @RequestBody RealtorAccessRequest request
    ) {
        return ResponseEntity.ok(adminService.updateRealtorAccess(id, request));
    }

    @DeleteMapping("/realtors/{id}")
    public ResponseEntity<Void> deleteRealtor(
            @PathVariable Long id,
            @Valid @RequestBody(required = false) DeleteRealtorRequest request
    ) {
        adminService.deleteRealtor(id, request != null ? request : new DeleteRealtorRequest());
        return ResponseEntity.noContent().build();
    }
}
