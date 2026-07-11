package com.chid.mortgage.service.property;

import org.junit.jupiter.api.Test;

import java.net.URI;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class SamoletPropertyParserTest {

    private final SamoletPropertyParser parser = new SamoletPropertyParser();

    @Test
    void parseHtml_detectsQratorBlock() {
        String html = "<html><script src=\"/__qrator/qauth.js\"></script></html>";

        Optional<com.chid.mortgage.dto.PropertyImportResponse> result =
                parser.parseHtml(html, URI.create("https://samolet.ru/project/test/flats/1/"));

        assertTrue(result.isPresent());
        assertTrue(result.get().isBlocked());
    }

    @Test
    void parseText_extractsPriceAndEnrichesProject() {
        String text = """
                2-комнатная квартира
                12 450 000 ₽
                Большое Юрлово
                """;

        URI uri = URI.create("https://samolet.ru/project/bolshoe-yurlovo/flats/467502/");
        Optional<com.chid.mortgage.dto.PropertyImportResponse> result = parser.parseText(text, uri);

        assertTrue(result.isPresent());
        assertEquals(12_450_000L, result.get().getPropertyPrice());
        assertTrue(result.get().getTitle().contains("2-комнатная"));
        assertTrue(result.get().getTitle().contains("Bolshoe Yurlovo")
                || result.get().getTitle().contains("ЖК"));
    }
}
