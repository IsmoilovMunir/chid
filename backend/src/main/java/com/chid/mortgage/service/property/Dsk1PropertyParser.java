package com.chid.mortgage.service.property;

import com.chid.mortgage.dto.PropertyImportResponse;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
@Order(2)
public class Dsk1PropertyParser implements PropertyPageParser {

    private static final Pattern H1_TITLE = Pattern.compile(
            "<h1[^>]*>\\s*([^<]{8,200})\\s*</h1>",
            Pattern.CASE_INSENSITIVE | Pattern.DOTALL
    );
    private static final Pattern ZHK_FROM_URL = Pattern.compile("/([^/]+)/flat/");

    @Override
    public boolean supports(URI uri) {
        String host = uri.getHost();
        return host != null && (host.equals("dsk1.ru") || host.equals("www.dsk1.ru"));
    }

    @Override
    public Optional<PropertyImportResponse> parseHtml(String html, URI uri) {
        if (html == null || html.isBlank()) {
            return Optional.empty();
        }

        Long price = PropertyImportSupport.extractJsonLdOfferPrice(html);
        if (price == null) {
            price = PropertyImportSupport.extractPriceFromText(html);
        }

        String title = firstNonBlank(
                extractH1Title(html),
                PropertyImportSupport.cleanListingTitle(PropertyImportSupport.extractOgMeta(html, "title")),
                PropertyImportSupport.cleanListingTitle(PropertyImportSupport.extractHtmlTitle(html)),
                PropertyImportSupport.extractJsonLdName(html)
        );
        title = enrichWithComplex(title, uri);

        if (title == null && price == null) {
            return Optional.empty();
        }

        return Optional.of(PropertyImportResponse.builder()
                .title(title)
                .propertyPrice(price)
                .source("dsk1")
                .blocked(false)
                .build());
    }

    @Override
    public Optional<PropertyImportResponse> parseText(String text, URI uri) {
        if (text == null || text.isBlank()) {
            return Optional.empty();
        }
        Long price = PropertyImportSupport.extractPriceFromText(text);
        if (price == null) {
            price = PropertyImportSupport.extractMillionRubPrice(text);
        }
        String title = PropertyImportSupport.extractTitleFromText(text);
        title = enrichWithComplex(title, uri);

        if (title == null && price == null) {
            return Optional.empty();
        }
        return Optional.of(PropertyImportResponse.builder()
                .title(title)
                .propertyPrice(price)
                .source("dsk1")
                .blocked(false)
                .message("Данные распознаны из вставленного текста")
                .build());
    }

    private String extractH1Title(String html) {
        Matcher matcher = H1_TITLE.matcher(html);
        if (!matcher.find()) {
            return null;
        }
        return PropertyImportSupport.normalizeWhitespace(matcher.group(1));
    }

    private String enrichWithComplex(String title, URI uri) {
        if (title == null || uri == null) {
            return title;
        }
        if (title.toLowerCase().contains("жк")) {
            return title;
        }
        Matcher matcher = ZHK_FROM_URL.matcher(uri.getPath());
        if (!matcher.find()) {
            return title;
        }
        String slug = matcher.group(1).replace('-', ' ');
        return title + ", ЖК " + capitalizeWords(slug);
    }

    private String capitalizeWords(String value) {
        String[] parts = value.split("\\s+");
        StringBuilder builder = new StringBuilder();
        for (int i = 0; i < parts.length; i++) {
            if (i > 0) {
                builder.append(' ');
            }
            String part = parts[i];
            if (part.isEmpty()) {
                continue;
            }
            builder.append(Character.toUpperCase(part.charAt(0)));
            if (part.length() > 1) {
                builder.append(part.substring(1));
            }
        }
        return builder.toString();
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
