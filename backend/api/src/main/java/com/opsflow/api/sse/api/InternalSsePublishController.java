package com.opsflow.api.sse.api;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.opsflow.api.sse.dto.SseEnvelopeV1;
import com.opsflow.api.sse.model.SseEvent;
import com.opsflow.api.sse.service.SseBroker;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.UUID;

@RestController
@RequestMapping("/internal/sse")
public class InternalSsePublishController {

  private final SseBroker broker;
  private final ObjectMapper om;
  private final String internalToken;

  public InternalSsePublishController(
      SseBroker broker,
      ObjectMapper om,
      @Value("${opsflow.internal.token:}") String internalToken
  ) {
    this.broker = broker;
    this.om = om;
    this.internalToken = internalToken;
  }

  public record PublishRequest(
      @NotNull UUID orgId,
      @NotBlank String eventType,
      @NotNull JsonNode payload,
      @NotNull Instant createdAt
  ) {}

  @PostMapping("/publish")
  public void publish(
      @RequestHeader(name = "X-OpsFlow-Internal", required = false) String token,
      @RequestBody PublishRequest req
  ) {
    if (internalToken != null && !internalToken.isBlank()) {
      if (token == null || !internalToken.equals(token)) {
        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "forbidden");
      }
    }

    UUID envelopeId = tryUuid(req.payload(), "timelineEventId");
    if (envelopeId == null) envelopeId = UUID.randomUUID();

    // Wrap the raw payload in a consistent envelope
    var env = SseEnvelopeV1.of(envelopeId, req.createdAt(), req.orgId(), req.eventType(), req.payload());
    JsonNode envJson = om.valueToTree(env);

    broker.publish(new SseEvent(req.orgId(), req.eventType(), envJson, req.createdAt()));
  }

  private static UUID tryUuid(JsonNode node, String field) {
    if (node == null) return null;
    JsonNode v = node.get(field);
    if (v == null || v.isNull()) return null;
    try {
      return UUID.fromString(v.asText());
    } catch (Exception e) {
      return null;
    }
  }
}