package com.chid.mortgage.controller;

import com.chid.mortgage.dto.PropertyImportRequest;
import com.chid.mortgage.dto.PropertyImportResponse;
import com.chid.mortgage.service.property.PropertyImportService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/property")
@RequiredArgsConstructor
public class PropertyImportController {

    private final PropertyImportService propertyImportService;

    @PostMapping("/import")
    public PropertyImportResponse importListing(@Valid @RequestBody PropertyImportRequest request) {
        return propertyImportService.importListing(request);
    }
}
