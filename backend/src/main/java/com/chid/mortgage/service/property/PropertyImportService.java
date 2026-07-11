package com.chid.mortgage.service.property;

import com.chid.mortgage.dto.PropertyImportRequest;
import com.chid.mortgage.dto.PropertyImportResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.net.URI;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class PropertyImportService {

    private final PropertyUrlFetcher fetcher;
    private final List<PropertyPageParser> parsers;

    public PropertyImportResponse importListing(PropertyImportRequest request) {
        URI uri = normalizeUrl(request.getUrl());
        String pastedText = request.getText() != null ? request.getText().trim() : "";

        if (!pastedText.isEmpty()) {
            PropertyImportResponse fromText = parseText(pastedText, uri);
            if (fromText != null) {
                return fromText;
            }
        }

        if (uri == null) {
            throw new IllegalArgumentException("Укажите ссылку на объявление или вставьте текст со страницы");
        }

        try {
            PropertyUrlFetcher.FetchResult fetched = fetcher.fetch(uri);
            if (fetched.statusCode() >= 400 || isProtectedBody(fetched.body())) {
                String message = PropertyFetchGuard.blockedMessage(uri, fetched.statusCode(), fetched.body())
                        .orElse("Сайт не отдал страницу автоматически. "
                                + "Скопируйте заголовок и цену со страницы и вставьте вручную.");
                return blockedLikeResponse(uri, message);
            }

            PropertyImportResponse fromHtml = parseHtml(fetched.body(), uri);
            if (fromHtml != null) {
                return fromHtml;
            }
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            return blockedLikeResponse(uri, "Не удалось загрузить страницу. "
                    + "Скопируйте заголовок и цену со страницы и вставьте вручную.");
        } catch (IOException ex) {
            return blockedLikeResponse(uri, "Не удалось загрузить страницу. "
                    + "Скопируйте заголовок и цену со страницы и вставьте вручную.");
        }

        return PropertyImportResponse.builder()
                .source(hostLabel(uri))
                .blocked(true)
                .message("Не удалось распознать данные на странице. "
                        + "Скопируйте заголовок и цену и вставьте в поле «Текст со страницы».")
                .build();
    }

    private PropertyImportResponse parseHtml(String html, URI uri) {
        for (PropertyPageParser parser : parsers) {
            if (!parser.supports(uri)) {
                continue;
            }
            Optional<PropertyImportResponse> parsed = parser.parseHtml(html, uri);
            if (parsed.isEmpty()) {
                continue;
            }
            PropertyImportResponse response = parsed.get();
            if (response.isBlocked()) {
                return response;
            }
            if (response.getTitle() != null || response.getPropertyPrice() != null) {
                return response;
            }
        }
        return null;
    }

    private PropertyImportResponse parseText(String text, URI uri) {
        for (PropertyPageParser parser : parsers) {
            if (uri != null && !parser.supports(uri)) {
                continue;
            }
            Optional<PropertyImportResponse> parsed = parser.parseText(text, uri);
            if (parsed.isPresent()) {
                return parsed.get();
            }
        }
        return null;
    }

    private PropertyImportResponse blockedLikeResponse(URI uri, String message) {
        return PropertyImportResponse.builder()
                .source(hostLabel(uri))
                .blocked(true)
                .message(message)
                .build();
    }

    private URI normalizeUrl(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        String trimmed = raw.trim();
        if (!trimmed.matches("(?i)^https?://.*")) {
            trimmed = "https://" + trimmed;
        }
        try {
            URI uri = URI.create(trimmed);
            if (uri.getHost() == null) {
                throw new IllegalArgumentException("Некорректная ссылка");
            }
            return stripTrackingQuery(uri);
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("Некорректная ссылка");
        }
    }

    private URI stripTrackingQuery(URI uri) {
        if (uri.getQuery() == null || uri.getQuery().isBlank()) {
            return uri;
        }
        String cleaned = uri.getScheme() + "://" + uri.getHost()
                + (uri.getPort() > 0 ? ":" + uri.getPort() : "")
                + uri.getPath();
        return URI.create(cleaned);
    }

    private boolean isProtectedBody(String body) {
        if (body == null || body.isBlank()) {
            return false;
        }
        return body.contains("qauth.js") || body.contains("__qrator");
    }

    private String hostLabel(URI uri) {
        return uri.getHost() != null ? uri.getHost() : "unknown";
    }
}
