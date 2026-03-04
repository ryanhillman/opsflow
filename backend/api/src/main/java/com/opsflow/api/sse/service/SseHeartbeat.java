package com.opsflow.api.sse.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.opsflow.api.sse.model.SseEvent;
import java.time.Instant;
import java.util.UUID;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class SseHeartbeat {

  private final SseBroker broker;
  private final ObjectMapper om;

  public SseHeartbeat(SseBroker broker, ObjectMapper om) {
    this.broker = broker;
    this.om = om;
  }

  @Scheduled(fixedDelayString = "${opsflow.sse.heartbeat.ms:15000}")
  public void tick() {
    // broadcast a lightweight heartbeat to each org that currently has emitters
    for (UUID orgId : broker.activeOrgIds()) {
      JsonNode payload = om.createObjectNode();
      broker.publish(new SseEvent(orgId, "system.heartbeat", payload, Instant.now()));
    }
  }
}