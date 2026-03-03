package com.opsflow.api.tenancy.model;

import jakarta.persistence.*;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "org_memberships")
@IdClass(OrgMembershipId.class)
public class OrgMembership {

    @Id
    @Column(name = "org_id", columnDefinition = "uuid")
    private UUID orgId;

    @Id
    @Column(name = "user_id", columnDefinition = "uuid")
    private UUID userId;

    @Column(nullable = false)
    private String role; // OWNER|ADMIN|MEMBER

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    protected OrgMembership() {}

    public UUID getOrgId() { return orgId; }
    public UUID getUserId() { return userId; }
    public String getRole() { return role; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
}