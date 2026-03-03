package com.opsflow.api.tenancy.model;

import java.io.Serializable;
import java.util.Objects;
import java.util.UUID;

public class OrgMembershipId implements Serializable {
    private UUID orgId;
    private UUID userId;

    public OrgMembershipId() {}

    public OrgMembershipId(UUID orgId, UUID userId) {
        this.orgId = orgId;
        this.userId = userId;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof OrgMembershipId that)) return false;
        return Objects.equals(orgId, that.orgId) && Objects.equals(userId, that.userId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(orgId, userId);
    }
}