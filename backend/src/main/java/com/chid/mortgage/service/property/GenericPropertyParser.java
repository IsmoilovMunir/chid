package com.chid.mortgage.service.property;

import com.chid.mortgage.dto.PropertyImportResponse;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.util.Optional;

@Component
@Order(100)
public class GenericPropertyParser implements PropertyPageParser {

    @Override
    public boolean supports(URI uri) {
        return true;
    }

    @Override
    public Optional<PropertyImportResponse> parseHtml(String html, URI uri) {
        if (html == null || html.isBlank()) {
            return Optional.empty();
        }

        Long price = PropertyImportSupport.extractPriceFromHtml(html);
        String title = firstNonBlank(
                PropertyImportSupport.cleanListingTitle(PropertyImportSupport.extractJsonLdName(html)),
                PropertyImportSupport.cleanListingTitle(PropertyImportSupport.extractOgMeta(html, "title")),
                PropertyImportSupport.cleanListingTitle(PropertyImportSupport.extractHtmlTitle(html))
        );
        String description = PropertyImportSupport.extractOgMeta(html, "description");

        if (title == null && price == null) {
            return Optional.empty();
        }

        return Optional.of(PropertyImportResponse.builder()
                .title(title)
                .propertyPrice(price)
                .address(description)
                .source(hostLabel(uri))
                .blocked(false)
                .build());
    }

    @Override
    public Optional<PropertyImportResponse> parseText(String text, URI uri) {
        if (text == null || text.isBlank()) {
            return Optional.empty();
        }
        Long price = PropertyImportSupport.extractPriceFromText(text);
        String title = PropertyImportSupport.extractTitleFromText(text);
        if (title == null && price == null) {
            return Optional.empty();
        }
        return Optional.of(PropertyImportResponse.builder()
                .title(title)
                .propertyPrice(price)
                .source(hostLabel(uri))
                .blocked(false)
                .message("Данные распознаны из вставленного текста")
                .build());
    }

    private String hostLabel(URI uri) {
        if (uri == null || uri.getHost() == null) {
            return "unknown";
        }
        return uri.getHost();
    }

    private String firstNonBlank(String... values) {
        for (String value : values) {
            if (value != null && !value.isBlank()) {
                return value.trim();
            }
        }
        return null;
    }
}
