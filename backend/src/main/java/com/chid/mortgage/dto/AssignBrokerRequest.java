package com.chid.mortgage.dto;

import lombok.Data;

@Data
public class AssignBrokerRequest {
    /** null — снять брокера со сделки */
    private Long brokerUserId;
}
