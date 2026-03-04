package com.opsflow.worker.outbox;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Component
public class OutboxPoller implements ApplicationRunner {

    private final JdbcTemplate jdbc;
    private final WebClient web;
    private final ObjectMapper om;

    private final int pollIntervalMs;
    private final int batchSize;
    private final int lockTtlSeconds;
    private final int backoffSeconds;
    private final String internalToken;

    public OutboxPoller(
            JdbcTemplate jdbc,
            ObjectMapper om,
            @Value("${opsflow.worker.pollIntervalMs:500}") int pollIntervalMs,
            @Value("${opsflow.worker.batchSize:25}") int batchSize,
            @Value("${opsflow.worker.lockTtlSeconds:300}") int lockTtlSeconds,
            @Value("${opsflow.worker.backoffSeconds:10}") int backoffSeconds,
            @Value("${opsflow.api.baseUrl}") String apiBaseUrl,
            @Value("${opsflow.api.internalToken:}") String internalToken
    ) {
        this.jdbc = jdbc;
        this.om = om;
        this.pollIntervalMs = pollIntervalMs;
        this.batchSize = batchSize;
        this.lockTtlSeconds = lockTtlSeconds;
        this.backoffSeconds = backoffSeconds;
        this.internalToken = internalToken;

        System.out.println("[worker] apiBaseUrl=" + apiBaseUrl);

        this.web = WebClient.builder()
                .baseUrl(apiBaseUrl)
                .build();
    }

    @Override
    public void run(ApplicationArguments args) throws Exception {
        while (true) {
            try {
                unlockStaleLocks();
                var events = claimBatch();
                for (var e : events) {
                    processOne(e);
                }
            } catch (Exception e) {
                System.err.println("[worker] loop error: " + e);
            }

            Thread.sleep(pollIntervalMs);
        }
    }

    private void unlockStaleLocks() {
        jdbc.update("""
            update outbox_events
               set locked_at = null
             where processed_at is null
               and locked_at is not null
               and locked_at < now() - (? || ' seconds')::interval
            """, String.valueOf(lockTtlSeconds));
    }

    private List<OutboxRow> claimBatch() {
        return jdbc.query("""
            with c as (
              select id
                from outbox_events
               where processed_at is null
                 and locked_at is null
                 and available_at <= now()
               order by created_at asc
               limit ?
               for update skip locked
            )
            update outbox_events o
               set locked_at = now(),
                   attempts = attempts + 1
              from c
             where o.id = c.id
            returning
              o.id, o.org_id, o.event_type, o.payload::text, o.created_at, o.attempts
            """,
            (rs, __) -> new OutboxRow(
                    UUID.fromString(rs.getString("id")),
                    UUID.fromString(rs.getString("org_id")),
                    rs.getString("event_type"),
                    rs.getString("payload"),
                    rs.getTimestamp("created_at").toInstant(),
                    rs.getInt("attempts")
            ),
            batchSize
        );
    }

    private void processOne(OutboxRow row) {
        try {
            JsonNode payload = om.readTree(row.payloadJson());

            // Map internal outbox event → SSE timeline event
            String sseType = switch (row.eventType()) {
                case "INCIDENT_CREATED" -> "timeline.incident.created";
                default -> row.eventType();
            };

            var req = new PublishRequest(row.orgId(), sseType, payload, row.createdAt());

            web.post()
                    .uri("/internal/sse/publish")
                    .header("X-OpsFlow-Internal", internalToken)
                    .bodyValue(req)
                    .retrieve()
                    .onStatus(s -> s.isError(), r ->
                            r.bodyToMono(String.class).flatMap(body ->
                                    Mono.error(new RuntimeException("HTTP " + r.statusCode() + " body=" + body))
                            )
                    )
                    .toBodilessEntity()
                    .timeout(Duration.ofSeconds(5))
                    .block();

            markProcessed(row.id());
        } catch (Exception ex) {
            System.err.println("[worker] publish failed outboxId=" + row.id() + " err=" + ex);
            markFailed(row.id(), ex.toString(), row.attempts());
        }
    }

    private void markProcessed(UUID id) {
        jdbc.update("""
            update outbox_events
               set processed_at = now(),
                   locked_at = null,
                   last_error = null
             where id = ?
            """, id);
    }

    private void markFailed(UUID id, String error, int attempts) {
        jdbc.update("""
            update outbox_events
               set locked_at = null,
                   last_error = left(?, 2000),
                   available_at = now() + (? || ' seconds')::interval
             where id = ?
            """, error == null ? "error" : error, String.valueOf(backoffSeconds), id);
    }

    record OutboxRow(UUID id, UUID orgId, String eventType, String payloadJson, Instant createdAt, int attempts) {}
    record PublishRequest(UUID orgId, String eventType, JsonNode payload, Instant createdAt) {}
}