package com.opsflow.api.timeline.repo;

import com.opsflow.api.timeline.model.IncidentTimelineEventEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface IncidentTimelineRepo extends JpaRepository<IncidentTimelineEventEntity, UUID> {}