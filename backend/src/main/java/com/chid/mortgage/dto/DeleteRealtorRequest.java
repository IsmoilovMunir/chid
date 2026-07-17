package com.chid.mortgage.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
public class DeleteRealtorRequest {

    @Valid
    private List<ClientReassignment> reassignments = new ArrayList<>();

    @Data
    public static class ClientReassignment {
        @NotNull
        private Long clientId;
        @NotNull
        private Long assignToUserId;
    }
}
