package com.opsflow.api.sse.api;

import com.opsflow.api.sse.service.SseBroker;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.opsflow.api.sse.OrgIdExtractor;
import com.opsflow.api.sse.dto.SseEnvelopeV1;
import java.io.IOException;
import java.time.Instant;
import java.util.UUID;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@RestController
@RequestMapping("/api/v1/sse")
public class PublicTimelineSseController {

  private final SseBroker broker;
  private final ObjectMapper om;

  public PublicTimelineSseController(SseBroker broker, ObjectMapper om) {
    this.broker = broker;
    this.om = om;
  }

  @GetMapping(value = "/timeline", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
  public ResponseEntity<SseEmitter> timeline(Authentication auth) throws IOException {
    UUID orgId = OrgIdExtractor.from(auth);
    SseEmitter emitter = broker.register(orgId);

    // immediately send a real event so the client confirms stream delivery
    var env = SseEnvelopeV1.of(
        UUID.randomUUID(),
        Instant.now(),
        orgId,
        "system.connected",
        om.createObjectNode()
    );

    emitter.send(SseEmitter.event()
        .name("system.connected")
        .data(env)
    );

    return ResponseEntity.ok()
        .contentType(MediaType.TEXT_EVENT_STREAM)
        .cacheControl(CacheControl.noCache())
        .header("X-Accel-Buffering", "no")
        .header("Cache-Control", "no-cache, no-transform")
        .body(emitter);
  }
}