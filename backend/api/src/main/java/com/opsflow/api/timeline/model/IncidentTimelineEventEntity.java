package com.opsflow.api.timeline.model;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "incident_timeline_events")
public class IncidentTimelineEventEntity {

    @Id
    @Column(columnDefinition = "uuid")
    private UUID id;

    @Column(name = "org_id", nullable = false, columnDefinition = "uuid")
    private UUID orgId;

    @Column(name = "incident_id", nullable = false, columnDefinition = "uuid")
    private UUID incidentId;

    @Column(nullable = false)
    private String type;

    @Column(nullable = false)
    private String message;

    @Column(name = "actor_user_id", columnDefinition = "uuid")
    private UUID actorUserId;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(nullable = false, columnDefinition = "jsonb")
    private JsonNode meta;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    protected IncidentTimelineEventEntity() {}

    public static IncidentTimelineEventEntity create(UUID orgId, UUID incidentId, String type, String message, UUID actorUserId, JsonNode meta) {
        var e = new IncidentTimelineEventEntity();
        e.id = UUID.randomUUID();
        e.orgId = orgId;
        e.incidentId = incidentId;
        e.type = type;
        e.message = message;
        e.actorUserId = actorUserId;
        e.meta = meta;
        e.createdAt = Instant.now();
        return e;
    }

    public UUID getId() { return id; }
}