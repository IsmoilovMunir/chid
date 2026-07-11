package com.chid.mortgage.service.property;

import com.chid.mortgage.dto.PropertyImportResponse;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
@Order(1)
public class CianPropertyParser implements PropertyPageParser {

    private static final Pattern ADDRESS = Pattern.compile(
            "\"(?:fullAddress|address|geo_address|userInput)\"\\s*:\\s*\"([^\"]+)\""
    );
    private static final Pattern BARGAIN_TERMS_PRICE = Pattern.compile(
            "\"bargainTerms\"\\s*:\\s*\\{[\\s\\S]*?\"(?:price|priceRur|rurPrice)\"\\s*:\\s*(\\d+)"
    );
    private static final Pattern TOTAL_PRICE_RUR = Pattern.compile("\"totalPriceRur\"\\s*:\\s*(\\d+)");

    @Override
    public boolean supports(URI uri) {
        String host = uri.getHost();
        return host != null && host.contains("cian.ru");
    }

    @Override
    public Optional<PropertyImportResponse> parseHtml(String html, URI uri) {
        if (html == null || html.isBlank()) {
            return Optional.empty();
        }
        if (isBlockedPage(html)) {
            return Optional.of(blockedResponse());
        }

        Long price = extractCianPrice(html);
        String title = firstNonBlank(
                PropertyImportSupport.extractJsonLdName(html),
                PropertyImportSupport.extractOgMeta(html, "title"),
                extractCianTitle(html)
        );
        String address = extractAddress(html);

        if (title == null && price == null && address == null) {
            return Optional.empty();
        }

        return Optional.of(PropertyImportResponse.builder()
                .title(title)
                .propertyPrice(price)
                .address(address)
                .source("cian")
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
                .source("cian")
                .blocked(false)
                .message("Данные распознаны из вставленного текста")
                .build());
    }

    private boolean isBlockedPage(String html) {
        return html.contains("cian_waf_block")
                || html.contains("VPNBlock")
                || html.contains("подозрительный трафик")
                || html.contains("Обнаружен подозрительный трафик");
    }

    private PropertyImportResponse blockedResponse() {
        return PropertyImportResponse.builder()
                .source("cian")
                .blocked(true)
                .message("ЦИАН блокирует автоматическую загрузку. Откройте объявление в браузере, "
                        + "выделите заголовок и цену (Ctrl+C) и вставьте в поле «Текст со страницы».")
                .build();
    }

    private String extractCianTitle(String html) {
        Pattern pattern = Pattern.compile(
                "\"(?:shareTitle|seoTitle|objectTitle|title)\"\\s*:\\s*\"([^\"]{8,200})\""
        );
        Matcher matcher = pattern.matcher(html);
        while (matcher.find()) {
            String candidate = matcher.group(1);
            if (!candidate.toLowerCase().contains("циан")) {
                return candidate;
            }
        }
        return null;
    }

    private String extractAddress(String html) {
        Matcher matcher = ADDRESS.matcher(html);
        if (matcher.find()) {
            return matcher.group(1);
        }
        return null;
    }

    private Long extractCianPrice(String html) {
        Matcher bargainMatcher = BARGAIN_TERMS_PRICE.matcher(html);
        if (bargainMatcher.find()) {
            return Long.parseLong(bargainMatcher.group(1));
        }

        Matcher totalMatcher = TOTAL_PRICE_RUR.matcher(html);
        if (totalMatcher.find()) {
            return Long.parseLong(totalMatcher.group(1));
        }

        return PropertyImportSupport.extractPriceFromText(html);
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
