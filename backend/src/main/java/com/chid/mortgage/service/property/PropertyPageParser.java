package com.chid.mortgage.service.property;

import com.chid.mortgage.dto.PropertyImportResponse;

import java.net.URI;
import java.util.Optional;

public interface PropertyPageParser {

    boolean supports(URI uri);

    Optional<PropertyImportResponse> parseHtml(String html, URI uri);

    Optional<PropertyImportResponse> parseText(String text, URI uri);
}
