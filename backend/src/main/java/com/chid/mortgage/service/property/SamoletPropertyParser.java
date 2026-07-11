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
public class SamoletPropertyParser implements PropertyPageParser {

    private static final Pattern PROJECT_SLUG = Pattern.compile("/project/([^/]+)/flats/(\\d+)");
    private static final Pattern FLAT_NUMBER = Pattern.compile("(?:квартира|№)\\s*#?\\s*(\\d+)", Pattern.CASE_INSENSITIVE);

    @Override
    public boolean supports(URI uri) {
        String host = uri.getHost();
        return host != null && host.contains("samolet.ru");
    }

    @Override
    public Optional<PropertyImportResponse> parseHtml(String html, URI uri) {
        if (html == null || html.isBlank()) {
            return Optional.empty();
        }
        if (html.contains("qauth.js") || html.contains("__qrator")) {
            return Optional.of(PropertyImportResponse.builder()
                    .source("samolet")
                    .blocked(true)
                    .message("Самолёт блокирует автоматическую загрузку (защита Qrator). "
                            + "Скопируйте название и цену со страницы и вставьте вручную.")
                    .build());
        }

        Long price = PropertyImportSupport.extractPriceFromHtml(html);
        String title = firstNonBlank(
                PropertyImportSupport.cleanListingTitle(PropertyImportSupport.extractOgMeta(html, "title")),
                PropertyImportSupport.cleanListingTitle(PropertyImportSupport.extractHtmlTitle(html)),
                PropertyImportSupport.extractJsonLdName(html)
        );
        title = enrichTitle(title, uri, textOrNull(html));

        if (title == null && price == null) {
            return Optional.empty();
        }

        return Optional.of(PropertyImportResponse.builder()
                .title(title)
                .propertyPrice(price)
                .source("samolet")
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
        title = enrichTitle(title, uri, text);

        if (title == null && price == null) {
            return Optional.empty();
        }

        return Optional.of(PropertyImportResponse.builder()
                .title(title)
                .propertyPrice(price)
                .source("samolet")
                .blocked(false)
                .message("Данные распознаны из вставленного текста")
                .build());
    }

    private String enrichTitle(String title, URI uri, String sourceText) {
        ProjectInfo project = extractProject(uri);
        if (project == null) {
            return title;
        }

        String base = title;
        if (base == null || base.isBlank()) {
            base = extractFlatLabel(sourceText, project.flatId());
        }
        if (base == null || base.isBlank()) {
            base = "Квартира " + project.flatId();
        }

        if (base.toLowerCase().contains(project.projectName().toLowerCase())) {
            return base;
        }
        return base + ", " + project.projectName();
    }

    private String extractFlatLabel(String text, String flatId) {
        if (text == null) {
            return null;
        }
        Matcher matcher = FLAT_NUMBER.matcher(text);
        while (matcher.find()) {
            if (matcher.group(1).equals(flatId)) {
                return "Квартира №" + flatId;
            }
        }
        return null;
    }

    private ProjectInfo extractProject(URI uri) {
        if (uri == null) {
            return null;
        }
        Matcher matcher = PROJECT_SLUG.matcher(uri.getPath());
        if (!matcher.find()) {
            return null;
        }
        String slug = matcher.group(1);
        String flatId = matcher.group(2);
        return new ProjectInfo("ЖК " + humanizeSlug(slug), flatId);
    }

    private String humanizeSlug(String slug) {
        String[] parts = slug.split("-");
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

    private String textOrNull(String value) {
        return value;
    }

    private String firstNonBlank(String... values) {
        for (String value : values) {
            if (value != null && !value.isBlank()) {
                return value.trim();
            }
        }
        return null;
    }

    private record ProjectInfo(String projectName, String flatId) {
    }
}
