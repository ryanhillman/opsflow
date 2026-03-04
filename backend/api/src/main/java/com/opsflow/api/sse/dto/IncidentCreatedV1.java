package com.opsflow.api.sse.dto;

import java.util.UUID;

public record IncidentCreatedV1(
    UUID incidentId,
    UUID serviceId,
    String title,
    String severity,
    String status,
    UUID createdByUserId,
    UUID timelineEventId
) {}