package com.opsflow.api.tenancy.repo;

import com.opsflow.api.tenancy.model.OrgMembership;
import com.opsflow.api.tenancy.model.OrgMembershipId;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface OrgMembershipRepo extends JpaRepository<OrgMembership, OrgMembershipId> {
    List<OrgMembership> findByUserId(UUID userId);
}