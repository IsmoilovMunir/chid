package com.chid.mortgage.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AdminDashboardResponse {

    private long clientsCount;
    private long calculationsCount;
    private long leadsCount;
    private long realtorsCount;
}
