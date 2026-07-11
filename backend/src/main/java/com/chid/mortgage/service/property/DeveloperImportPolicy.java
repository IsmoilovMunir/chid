package com.chid.mortgage.service.property;

import java.net.URI;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;

final class DeveloperImportPolicy {

    private static final Map<String, Policy> BY_HOST = Map.ofEntries(
            Map.entry("pik.ru", new Policy("ПИК", ImportMode.PASTE, "Qrator")),
            Map.entry("samolet.ru", new Policy("Самолёт", ImportMode.PASTE, "Qrator")),
            Map.entry("b2-dev.ru", new Policy("Б2-Девелопмент", ImportMode.PASTE, "Qrator")),
            Map.entry("glavstroy-regions.ru", new Policy("Главстрой-Регионы", ImportMode.PASTE, "Qrator")),
            Map.entry("strana-dev.ru", new Policy("Страна Девелопмент", ImportMode.PASTE, "Qrator")),
            Map.entry("strana.com", new Policy("Страна Девелопмент", ImportMode.PASTE, "Qrator")),
            Map.entry("lsr.ru", new Policy("ЛСР", ImportMode.PASTE, "WAF")),
            Map.entry("dsk1.ru", new Policy("1-й ДСК", ImportMode.LINK, null)),
            Map.entry("a101.ru", new Policy("А101", ImportMode.LINK, null)),
            Map.entry("fsk.ru", new Policy("ФСК", ImportMode.LINK, null)),
            Map.entry("cian.ru", new Policy("ЦИАН", ImportMode.LINK, null))
    );

    private DeveloperImportPolicy() {
    }

    static Optional<Policy> find(URI uri) {
        if (uri == null || uri.getHost() == null) {
            return Optional.empty();
        }
        String host = uri.getHost().toLowerCase(Locale.ROOT).replaceFirst("^www\\.", "");
        if (BY_HOST.containsKey(host)) {
            return Optional.of(BY_HOST.get(host));
        }
        for (Map.Entry<String, Policy> entry : BY_HOST.entrySet()) {
            if (host.endsWith("." + entry.getKey())) {
                return Optional.of(entry.getValue());
            }
        }
        return Optional.empty();
    }

    static Optional<String> blockedMessage(URI uri, int statusCode, String body) {
        String host = hostLabel(uri);
        String html = body != null ? body : "";
        Optional<Policy> policy = find(uri);

        if (html.contains("qauth.js") || html.contains("__qrator")) {
            String name = policy.map(Policy::name).orElse(host);
            return Optional.of(name + " блокирует автоматическую загрузку (защита Qrator). "
                    + "Это не ошибка входа в CRM. Скопируйте название и цену со страницы "
                    + "и вставьте в поле «Текст со страницы».");
        }

        if (policy.isPresent() && policy.get().mode() == ImportMode.PASTE) {
            return Optional.of(policy.get().name() + " не отдаёт страницу серверу ("
                    + policy.get().guard() + "). Скопируйте название и цену вручную.");
        }

        if (host.contains("cian.ru") || html.contains("cian_waf_block")) {
            return Optional.of(
                    "ЦИАН временно блокирует загрузку. Попробуйте ещё раз или вставьте текст со страницы."
            );
        }

        if (statusCode == 403 || (statusCode >= 400 && html.toLowerCase().contains("forbidden"))) {
            String name = policy.map(Policy::name).orElse(host);
            return Optional.of(name + " не отдал страницу (код " + statusCode + "). "
                    + "Скопируйте заголовок и цену и вставьте вручную.");
        }

        if (statusCode >= 400) {
            return Optional.of(
                    "Сайт " + host + " не отдал страницу автоматически (код " + statusCode + "). "
                            + "Это не ошибка входа в CRM — вставьте текст со страницы."
            );
        }

        return Optional.empty();
    }

    private static String hostLabel(URI uri) {
        if (uri == null || uri.getHost() == null) {
            return "сайт";
        }
        return uri.getHost().toLowerCase(Locale.ROOT);
    }

    enum ImportMode {
        LINK,
        PASTE
    }

    record Policy(String name, ImportMode mode, String guard) {
    }
}
