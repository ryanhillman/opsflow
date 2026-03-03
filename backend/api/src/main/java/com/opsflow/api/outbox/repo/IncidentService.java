package com.opsflow.api.incidents.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.opsflow.api.common.web.RequestContextHolder;
import com.opsflow.api.incidents.model.IncidentEntity;
import com.opsflow.api.incidents.model.IncidentSeverity;
import com.opsflow.api.incidents.repo.IncidentRepo;
import com.opsflow.api.outbox.model.OutboxEventEntity;
import com.opsflow.api.outbox.repo.OutboxRepo;
import com.opsflow.api.services.repo.ServiceRepo;
import com.opsflow.api.timeline.model.IncidentTimelineEventEntity;
import com.opsflow.api.timeline.repo.IncidentTimelineRepo;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.UUID;

@Service
public class IncidentService {

    private final ServiceRepo serviceRepo;
    private final IncidentRepo incidentRepo;
    private final IncidentTimelineRepo timelineRepo;
    private final OutboxRepo outboxRepo;
    private final ObjectMapper om;

    public IncidentService(ServiceRepo serviceRepo, IncidentRepo incidentRepo, IncidentTimelineRepo timelineRepo, OutboxRepo outboxRepo, ObjectMapper om) {
        this.serviceRepo = serviceRepo;
        this.incidentRepo = incidentRepo;
        this.timelineRepo = timelineRepo;
        this.outboxRepo = outboxRepo;
        this.om = om;
    }

    @Transactional
    public Result create(UUID serviceId, String title, IncidentSeverity severity) {
        var ctx = RequestContextHolder.get();
        var orgId = ctx.orgId();
        var userId = ctx.userId();

        // ensure service belongs to org
        serviceRepo.findByIdAndOrgId(serviceId, orgId)
                .orElseThrow(() -> new IllegalArgumentException("service not found"));

        var incident = incidentRepo.save(IncidentEntity.create(orgId, serviceId, title, severity, userId));

        var meta = om.valueToTree(new LinkedHashMap<String, Object>() {{
            put("severity", incident.getSeverity().name());
            put("status", incident.getStatus().name());
        }});

        var timeline = timelineRepo.save(
                IncidentTimelineEventEntity.create(orgId, incident.getId(), "INCIDENT_CREATED", "Incident created", userId, meta)
        );

        var payload = om.valueToTree(new LinkedHashMap<String, Object>() {{
            put("orgId", orgId.toString());
            put("incidentId", incident.getId().toString());
            put("timelineEventId", timeline.getId().toString());
            put("type", "INCIDENT_CREATED");
        }});

        outboxRepo.save(OutboxEventEntity.create(orgId, "INCIDENT", incident.getId(), "INCIDENT_CREATED", payload));

        return new Result(incident.getId());
    }

    public record Result(UUID incidentId) {}
}