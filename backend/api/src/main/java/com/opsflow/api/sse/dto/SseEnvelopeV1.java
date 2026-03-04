package com.opsflow.api.sse.dto;

import java.time.Instant;
import java.util.UUID;

public record SseEnvelopeV1<T>(
    int v,
    UUID id,
    Instant ts,
    UUID orgId,
    String type,
    T data
) {
  public static <T> SseEnvelopeV1<T> of(UUID id, Instant ts, UUID orgId, String type, T data) {
    return new SseEnvelopeV1<>(
        1,
        id,
        ts,
        orgId,
        type,
        data
    );
  }

  // optional convenience for ad-hoc server-side events (like system.connected)
  public static <T> SseEnvelopeV1<T> ofNow(UUID orgId, String type, T data) {
    return new SseEnvelopeV1<>(
        1,
        UUID.randomUUID(),
        Instant.now(),
        orgId,
        type,
        data
    );
  }
}