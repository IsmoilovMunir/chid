package com.chid.mortgage.dto;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class PropertyImportRequest {

    @Size(max = 2000)
    private String url;

    /** Текст, скопированный со страницы объявления (обход блокировки ЦИАН и др.) */
    @Size(max = 20000)
    private String text;
}
