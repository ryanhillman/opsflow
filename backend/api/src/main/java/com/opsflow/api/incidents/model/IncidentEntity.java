package com.opsflow.api.incidents.model;

import jakarta.persistence.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "incidents")
public class IncidentEntity {

    @Id
    @Column(columnDefinition = "uuid")
    private UUID id;

    @Column(name = "org_id", nullable = false, columnDefinition = "uuid")
    private UUID orgId;

    @Column(name = "service_id", nullable = false, columnDefinition = "uuid")
    private UUID serviceId;

    @Column(nullable = false)
    private String title;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private IncidentStatus status;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private IncidentSeverity severity;

    @Column(name = "created_by", nullable = false, columnDefinition = "uuid")
    private UUID createdBy;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Column(name = "resolved_at")
    private Instant resolvedAt;

    protected IncidentEntity() {}

    public static IncidentEntity create(UUID orgId, UUID serviceId, String title, IncidentSeverity severity, UUID createdBy) {
        var now = Instant.now();
        var e = new IncidentEntity();
        e.id = UUID.randomUUID();
        e.orgId = orgId;
        e.serviceId = serviceId;
        e.title = title;
        e.status = IncidentStatus.OPEN;
        e.severity = severity;
        e.createdBy = createdBy;
        e.createdAt = now;
        e.updatedAt = now;
        return e;
    }

    public UUID getId() { return id; }
    public UUID getOrgId() { return orgId; }
    public UUID getServiceId() { return serviceId; }
    public String getTitle() { return title; }
    public IncidentStatus getStatus() { return status; }
    public IncidentSeverity getSeverity() { return severity; }
    public UUID getCreatedBy() { return createdBy; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public Instant getResolvedAt() { return resolvedAt; }

    public void setStatus(IncidentStatus status) { this.status = status; }
    public void setSeverity(IncidentSeverity severity) { this.severity = severity; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
    public void setResolvedAt(Instant resolvedAt) { this.resolvedAt = resolvedAt; }
}