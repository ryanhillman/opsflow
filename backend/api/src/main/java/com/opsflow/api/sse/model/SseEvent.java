package com.opsflow.api.sse.model;

import com.fasterxml.jackson.databind.JsonNode;

import java.time.Instant;
import java.util.UUID;

public record SseEvent(
        UUID orgId,
        String eventType,
        JsonNode payload,
        Instant createdAt
) {}