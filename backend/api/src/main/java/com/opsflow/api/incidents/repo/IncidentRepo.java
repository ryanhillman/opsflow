package com.opsflow.api.incidents.repo;

import com.opsflow.api.incidents.model.IncidentEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface IncidentRepo extends JpaRepository<IncidentEntity, UUID> {

    List<IncidentEntity> findAllByOrgId(UUID orgId);

    Optional<IncidentEntity> findByIdAndOrgId(UUID id, UUID orgId);
}