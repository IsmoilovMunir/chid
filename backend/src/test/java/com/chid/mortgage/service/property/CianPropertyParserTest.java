package com.chid.mortgage.service.property;

import org.junit.jupiter.api.Test;

import java.net.URI;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class CianPropertyParserTest {

    private final CianPropertyParser parser = new CianPropertyParser();

    @Test
    void parseText_extractsTitleAndPrice() {
        String text = """
                Дом, 250 м², участок 15 сот., Московская область
                45 000 000 ₽
                Показать телефон
                """;

        Optional<com.chid.mortgage.dto.PropertyImportResponse> result =
                parser.parseText(text, URI.create("https://www.cian.ru/sale/suburban/330167278/"));

        assertTrue(result.isPresent());
        assertEquals("Дом, 250 м², участок 15 сот., Московская область", result.get().getTitle());
        assertEquals(45_000_000L, result.get().getPropertyPrice());
    }

    @Test
    void parseHtml_detectsBlockedPage() {
        String html = "<html><body>cian_waf_block VPNBlock</body></html>";

        Optional<com.chid.mortgage.dto.PropertyImportResponse> result =
                parser.parseHtml(html, URI.create("https://www.cian.ru/flat/1/"));

        assertTrue(result.isPresent());
        assertTrue(result.get().isBlocked());
    }

    @Test
    void parseHtml_extractsEmbeddedPrice() {
        String html = """
                <html><script>
                {"bargainTerms":{"price":12500000},"shareTitle":"2-комн. квартира, 54 м², ЖК Солнечный"}
                </script></html>
                """;

        Optional<com.chid.mortgage.dto.PropertyImportResponse> result =
                parser.parseHtml(html, URI.create("https://www.cian.ru/flat/1/"));

        assertTrue(result.isPresent());
        assertEquals(12_500_000L, result.get().getPropertyPrice());
        assertEquals("2-комн. квартира, 54 м², ЖК Солнечный", result.get().getTitle());
    }

    @Test
    void parseHtml_prefersBargainTermsPriceOverOtherPrices() {
        String html = """
                <html><script>
                {"bargainTerms":{"price":47000000},"mortgage":{"price":49500000},"similar":[{"price":52000000}]}
                </script></html>
                """;

        Optional<com.chid.mortgage.dto.PropertyImportResponse> result =
                parser.parseHtml(html, URI.create("https://www.cian.ru/flat/1/"));

        assertTrue(result.isPresent());
        assertEquals(47_000_000L, result.get().getPropertyPrice());
    }

    @Test
    void parseText_prefersFirstPriceWhenMultiple() {
        String text = """
                Дом, 250 м², Московская область
                47 000 000 ₽
                Ипотека
                49 500 000 ₽
                """;

        Optional<com.chid.mortgage.dto.PropertyImportResponse> result =
                parser.parseText(text, URI.create("https://www.cian.ru/sale/suburban/330167278/"));

        assertTrue(result.isPresent());
        assertEquals(47_000_000L, result.get().getPropertyPrice());
    }
}
