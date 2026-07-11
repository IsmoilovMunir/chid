package com.chid.mortgage.service.property;

import org.junit.jupiter.api.Test;

import java.net.URI;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assumptions.assumeTrue;

class Dsk1PropertyParserTest {

    private final Dsk1PropertyParser parser = new Dsk1PropertyParser();
    private final GenericPropertyParser genericParser = new GenericPropertyParser();

    @Test
    void parseHtml_extractsPriceAndTitleFromDskSnippet() {
        String html = """
                <html><head>
                <title>3-комнатная квартира №669 74.9 м2 за 17,35 млн. руб. – купить в ЖК 1-й Химкинский</title>
                <meta property="og:title" content="3-комнатная квартира №669 74.9 м2 – купить в ЖК 1-й Химкинский">
                <script type="application/ld+json">{"@type":"Offer","price":"17\u00a0354\u00a0630\u00a0₽","priceCurrency":"RUB","name":"№ 669, 3‑комнатная квартира, 74.9 м²"}</script>
                </head><body>17\u00a0354\u00a0630\u00a0₽</body></html>
                """;

        URI uri = URI.create("https://www.dsk1.ru/1-himkinskij/flat/233961");
        Optional<com.chid.mortgage.dto.PropertyImportResponse> result = parser.parseHtml(html, uri);

        assertTrue(result.isPresent());
        assertEquals(17_354_630L, result.get().getPropertyPrice());
        assertNotNull(result.get().getTitle());
        assertTrue(result.get().getTitle().contains("669"));
        assertTrue(result.get().getTitle().contains("Химкинский"));
    }

    @Test
    void parseHtml_worksWithDownloadedPage() throws Exception {
        Path page = Path.of("/tmp/dsk1.html");
        assumeTrue(Files.exists(page), "Run curl fetch first");

        String html = Files.readString(page);
        URI uri = URI.create("https://www.dsk1.ru/1-himkinskij/flat/233961");

        Optional<com.chid.mortgage.dto.PropertyImportResponse> result = parser.parseHtml(html, uri);
        assertTrue(result.isPresent());
        assertEquals(17_354_630L, result.get().getPropertyPrice());
    }

    @Test
    void genericParser_alsoExtractsDskPrice() {
        String html = """
                <meta property="og:title" content="3-комнатная квартира №669 74.9 м2 – купить в ЖК 1-й Химкинский">
                17\u00a0354\u00a0630\u00a0₽
                """;

        Optional<com.chid.mortgage.dto.PropertyImportResponse> result =
                genericParser.parseHtml(html, URI.create("https://www.dsk1.ru/flat/1"));

        assertTrue(result.isPresent());
        assertEquals(17_354_630L, result.get().getPropertyPrice());
    }
}
