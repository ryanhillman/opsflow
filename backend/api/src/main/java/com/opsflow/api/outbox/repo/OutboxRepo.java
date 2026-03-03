package com.opsflow.api.outbox.repo;

import com.opsflow.api.outbox.model.OutboxEventEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface OutboxRepo extends JpaRepository<OutboxEventEntity, UUID> {}