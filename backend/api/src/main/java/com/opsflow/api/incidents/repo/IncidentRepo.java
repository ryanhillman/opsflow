package com.opsflow.api.incidents.repo;

import com.opsflow.api.incidents.model.IncidentEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface IncidentRepo extends JpaRepository<IncidentEntity, UUID> {}