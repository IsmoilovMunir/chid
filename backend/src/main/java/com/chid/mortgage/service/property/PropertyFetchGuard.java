package com.chid.mortgage.service.property;

import java.net.URI;
import java.util.Optional;

/** @deprecated use {@link DeveloperImportPolicy} */
@Deprecated
final class PropertyFetchGuard {

    private PropertyFetchGuard() {
    }

    static Optional<String> blockedMessage(URI uri, int statusCode, String body) {
        return DeveloperImportPolicy.blockedMessage(uri, statusCode, body);
    }
}
