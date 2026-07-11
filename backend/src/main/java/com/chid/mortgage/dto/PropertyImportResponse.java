package com.chid.mortgage.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class PropertyImportResponse {

    private String title;
    private Long propertyPrice;
    private String address;
    private String source;
    private boolean blocked;
    private String message;
}
