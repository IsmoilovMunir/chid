package com.chid.mortgage.service.property;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

final class PropertyImportSupport {

    private static final Pattern PRICE_RUB = Pattern.compile(
            "(\\d[\\d\\s\\u00a0\\u202f]{2,})\\s*(?:₽|руб\\.?|RUB)",
            Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE
    );
    private static final Pattern PRICE_MLN = Pattern.compile(
            "(\\d{1,3})[,.](\\d{1,2})\\s*млн\\.?\\s*руб",
            Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE
    );
    private static final Pattern JSON_LD_OFFER_PRICE = Pattern.compile(
            "\"@type\"\\s*:\\s*\"Offer\"[\\s\\S]{0,3000}?\"price\"\\s*:\\s*(?:\"([^\"]+)\"|(\\d+))",
            Pattern.CASE_INSENSITIVE
    );

    private PropertyImportSupport() {
    }

    /** Первая заметная цена — на странице объявления это обычно основная стоимость. */
    static Long extractPriceFromText(String text) {
        if (text == null || text.isBlank()) {
            return null;
        }
        Matcher matcher = PRICE_RUB.matcher(text);
        while (matcher.find()) {
            Long value = parseDigits(matcher.group(1));
            if (value != null && value >= 100_000) {
                return value;
            }
        }
        return extractMillionRubPrice(text);
    }

    static Long extractMillionRubPrice(String text) {
        if (text == null || text.isBlank()) {
            return null;
        }
        Matcher matcher = PRICE_MLN.matcher(text);
        if (!matcher.find()) {
            return null;
        }
        long whole = Long.parseLong(matcher.group(1));
        int fraction = Integer.parseInt(matcher.group(2));
        return whole * 1_000_000L + fraction * 10_000L;
    }

    static Long extractPriceFromHtml(String html) {
        if (html == null || html.isBlank()) {
            return null;
        }
        Long fromJsonLd = extractJsonLdOfferPrice(html);
        if (fromJsonLd != null) {
            return fromJsonLd;
        }
        return extractPriceFromText(html);
    }

    static Long extractJsonLdOfferPrice(String html) {
        if (html == null || html.isBlank()) {
            return null;
        }
        Matcher matcher = JSON_LD_OFFER_PRICE.matcher(html);
        if (!matcher.find()) {
            return null;
        }
        if (matcher.group(2) != null) {
            long value = Long.parseLong(matcher.group(2));
            return value >= 100_000 ? value : null;
        }
        return parsePriceToken(matcher.group(1));
    }

    static String extractTitleFromText(String text) {
        if (text == null || text.isBlank()) {
            return null;
        }
        String[] lines = text.split("\\R");
        for (String line : lines) {
            String trimmed = line.trim();
            if (trimmed.length() < 8) {
                continue;
            }
            if (PRICE_RUB.matcher(trimmed).find()) {
                continue;
            }
            if (trimmed.matches("(?i).*(поделиться|избранн|показать телефон|написать|цена|консультац).*")) {
                continue;
            }
            return trimmed.length() > 200 ? trimmed.substring(0, 200) : trimmed;
        }
        return null;
    }

    static String extractOgMeta(String html, String property) {
        if (html == null) {
            return null;
        }
        Pattern pattern = Pattern.compile(
                "<meta[^>]+property=[\"']og:" + property + "[\"'][^>]+content=[\"']([^\"']+)[\"']",
                Pattern.CASE_INSENSITIVE
        );
        Matcher matcher = pattern.matcher(html);
        if (matcher.find()) {
            return decodeHtml(matcher.group(1));
        }
        Pattern alt = Pattern.compile(
                "<meta[^>]+content=[\"']([^\"']+)[\"'][^>]+property=[\"']og:" + property + "[\"']",
                Pattern.CASE_INSENSITIVE
        );
        matcher = alt.matcher(html);
        return matcher.find() ? decodeHtml(matcher.group(1)) : null;
    }

    static String extractHtmlTitle(String html) {
        if (html == null) {
            return null;
        }
        Pattern pattern = Pattern.compile("<title>([^<]{8,300})</title>", Pattern.CASE_INSENSITIVE | Pattern.DOTALL);
        Matcher matcher = pattern.matcher(html);
        return matcher.find() ? decodeHtml(matcher.group(1)) : null;
    }

    static String cleanListingTitle(String title) {
        if (title == null || title.isBlank()) {
            return null;
        }
        String trimmed = title.trim();
        if (trimmed.contains(" – купить в ЖК ")) {
            return trimmed.replace(" – купить в ", ", ").trim();
        }
        if (trimmed.contains(" - купить в ЖК ")) {
            return trimmed.replace(" - купить в ", ", ").trim();
        }
        for (String suffix : new String[] {" – купить", " - купить", " | "}) {
            int idx = trimmed.indexOf(suffix);
            if (idx > 0) {
                trimmed = trimmed.substring(0, idx).trim();
            }
        }
        return trimmed.isEmpty() ? null : trimmed;
    }

    static String extractJsonLdName(String html) {
        if (html == null) {
            return null;
        }
        Pattern pattern = Pattern.compile(
                "\"@type\"\\s*:\\s*\"(?:Product|Offer|Apartment)\"[\\s\\S]{0,1200}?\"name\"\\s*:\\s*\"([^\"]+)\"",
                Pattern.CASE_INSENSITIVE
        );
        Matcher matcher = pattern.matcher(html);
        return matcher.find() ? decodeJson(matcher.group(1)) : null;
    }

    static String normalizeWhitespace(String value) {
        return value.replaceAll("\\s+", " ").trim();
    }

    private static Long parsePriceToken(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        Long fromMln = extractMillionRubPrice(raw);
        if (fromMln != null) {
            return fromMln;
        }
        return parseDigits(raw);
    }

    private static Long parseDigits(String raw) {
        String digits = raw.replaceAll("[^0-9]", "");
        if (digits.isEmpty()) {
            return null;
        }
        try {
            long value = Long.parseLong(digits);
            return value >= 100_000 ? value : null;
        } catch (NumberFormatException ex) {
            return null;
        }
    }

    private static String decodeHtml(String value) {
        return value
                .replace("&quot;", "\"")
                .replace("&#x27;", "'")
                .replace("&amp;", "&")
                .trim();
    }

    private static String decodeJson(String value) {
        return value.replace("\\\"", "\"").replace("\\/", "/").trim();
    }
}
