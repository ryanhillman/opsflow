package com.opsflow.api.services.repo;

import com.opsflow.api.services.model.ServiceEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface ServiceRepo extends JpaRepository<ServiceEntity, UUID> {
    Optional<ServiceEntity> findByIdAndOrgId(UUID id, UUID orgId);
}