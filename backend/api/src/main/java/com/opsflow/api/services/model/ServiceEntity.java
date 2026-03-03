package com.opsflow.api.services.model;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "services",
        uniqueConstraints = @UniqueConstraint(name = "uk_services_org_key", columnNames = {"org_id", "key"}))
public class ServiceEntity {

    @Id
    @Column(columnDefinition = "uuid")
    private UUID id;

    @Column(name = "org_id", nullable = false, columnDefinition = "uuid")
    private UUID orgId;

    @Column(nullable = false)
    private String name;

    @Column(name = "\"key\"", nullable = false)
    private String key;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    protected ServiceEntity() {}

    public UUID getId() { return id; }
    public UUID getOrgId() { return orgId; }
    public String getName() { return name; }
    public String getKey() { return key; }
    public Instant getCreatedAt() { return createdAt; }
}