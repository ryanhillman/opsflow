package com.opsflow.api.sse;

import com.opsflow.api.sse.dto.SseEnvelopeV1;
import java.io.IOException;
import java.time.Duration;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArraySet;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@Component
public class SseBroadcaster {
  private static final Logger log = LoggerFactory.getLogger(SseBroadcaster.class);

  // orgId -> emitters
  private final ConcurrentHashMap<UUID, CopyOnWriteArraySet<SseEmitter>> orgEmitters =
      new ConcurrentHashMap<>();

  public SseEmitter register(UUID orgId) {
    // Practical default: 30 minutes; controller will recreate on reconnect
    long timeoutMs = Duration.ofMinutes(30).toMillis();
    SseEmitter emitter = new SseEmitter(timeoutMs);

    CopyOnWriteArraySet<SseEmitter> set =
        orgEmitters.computeIfAbsent(orgId, __ -> new CopyOnWriteArraySet<>());
    set.add(emitter);

    emitter.onCompletion(() -> remove(orgId, emitter));
    emitter.onTimeout(() -> remove(orgId, emitter));
    emitter.onError(ex -> remove(orgId, emitter));

    log.info("SSE connected orgId={} active={}", orgId, set.size());
    return emitter;
  }

  public void broadcast(UUID orgId, SseEnvelopeV1<?> envelope) {
    Set<SseEmitter> set = orgEmitters.get(orgId);
    if (set == null || set.isEmpty()) return;

    for (SseEmitter emitter : set) {
      try {
        emitter.send(
            SseEmitter.event()
                .name(envelope.type())
                .id(envelope.id().toString())
                .data(envelope, MediaType.APPLICATION_JSON)
        );
      } catch (IOException ex) {
        remove(orgId, emitter);
      }
    }
  }

  public void heartbeat(UUID orgId) {
    broadcast(orgId, SseEnvelopeV1.ofNow(orgId, "system.heartbeat", new Object()));
  }

  public int active(UUID orgId) {
    Set<SseEmitter> set = orgEmitters.get(orgId);
    return set == null ? 0 : set.size();
  }

  private void remove(UUID orgId, SseEmitter emitter) {
    CopyOnWriteArraySet<SseEmitter> set = orgEmitters.get(orgId);
    if (set == null) return;

    set.remove(emitter);
    if (set.isEmpty()) orgEmitters.remove(orgId);

    log.info("SSE disconnected orgId={} active={}", orgId, set.size());
  }
}