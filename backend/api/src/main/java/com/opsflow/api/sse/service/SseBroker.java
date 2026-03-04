package com.opsflow.api.sse.service;

import com.opsflow.api.sse.model.SseEvent;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

@Service
public class SseBroker {

    private final ConcurrentHashMap<UUID, CopyOnWriteArrayList<SseEmitter>> emittersByOrg = new ConcurrentHashMap<>();

    public SseEmitter register(UUID orgId) {
        var emitter = new SseEmitter(0L); // no timeout
        emittersByOrg.computeIfAbsent(orgId, __ -> new CopyOnWriteArrayList<>()).add(emitter);

        System.out.println("[sse] register org=" + orgId + " emittersNow=" + emittersByOrg.get(orgId).size());

        emitter.onCompletion(() -> remove(orgId, emitter));
        emitter.onTimeout(() -> remove(orgId, emitter));
        emitter.onError(__ -> remove(orgId, emitter));

        return emitter;
    }

    public void publish(SseEvent event) {
        var emitters = emittersByOrg.get(event.orgId());
        System.out.println("[sse] publish type=" + event.eventType() + " org=" + event.orgId()
                + " emitters=" + (emitters == null ? 0 : emitters.size()));

        if (emitters == null || emitters.isEmpty()) return;

        for (var emitter : emitters) {
            try {
                emitter.send(SseEmitter.event()
                        .name(event.eventType())
                        .data(event.payload())
                );
            } catch (Exception e) {
                remove(event.orgId(), emitter);
            }
        }
    }

    public Set<UUID> activeOrgIds() {
        return emittersByOrg.keySet();
    }

    private void remove(UUID orgId, SseEmitter emitter) {
        var emitters = emittersByOrg.get(orgId);
        if (emitters == null) return;

        emitters.remove(emitter);
        if (emitters.isEmpty()) {
            emittersByOrg.remove(orgId);
            System.out.println("[sse] remove org=" + orgId + " removed last emitter");
        } else {
            System.out.println("[sse] remove org=" + orgId + " remaining=" + emitters.size());
        }
    }
}