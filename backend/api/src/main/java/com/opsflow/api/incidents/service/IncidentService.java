package com.opsflow.api.incidents.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.opsflow.api.common.web.RequestContextHolder;
import com.opsflow.api.incidents.model.IncidentEntity;
import com.opsflow.api.incidents.model.IncidentSeverity;
import com.opsflow.api.incidents.model.IncidentStatus;
import com.opsflow.api.incidents.repo.IncidentRepo;
import com.opsflow.api.outbox.model.OutboxEventEntity;
import com.opsflow.api.outbox.repo.OutboxRepo;
import com.opsflow.api.services.repo.ServiceRepo;
import com.opsflow.api.timeline.model.IncidentTimelineEventEntity;
import com.opsflow.api.timeline.repo.IncidentTimelineRepo;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.NoSuchElementException;
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

    @Transactional
    public void ack(UUID id) {
        var ctx = RequestContextHolder.get();
        var orgId = ctx.orgId();
        var userId = ctx.userId();

        var incident = incidentRepo.findByIdAndOrgId(id, orgId)
                .orElseThrow(() -> new NoSuchElementException("incident not found"));

        var prevStatus = incident.getStatus();
        incident.setStatus(IncidentStatus.MITIGATING);
        incident.setUpdatedAt(Instant.now());
        incidentRepo.save(incident);

        var meta = om.valueToTree(new LinkedHashMap<String, Object>() {{
            put("previousStatus", prevStatus.name());
            put("status", incident.getStatus().name());
        }});
        var timeline = timelineRepo.save(
                IncidentTimelineEventEntity.create(orgId, incident.getId(), "INCIDENT_ACKNOWLEDGED", "Incident acknowledged", userId, meta)
        );

        var payload = om.valueToTree(new LinkedHashMap<String, Object>() {{
            put("orgId", orgId.toString());
            put("incidentId", incident.getId().toString());
            put("timelineEventId", timeline.getId().toString());
            put("type", "INCIDENT_ACKNOWLEDGED");
            put("previousStatus", prevStatus.name());
            put("status", incident.getStatus().name());
        }});
        outboxRepo.save(OutboxEventEntity.create(orgId, "INCIDENT", incident.getId(), "INCIDENT_ACKNOWLEDGED", payload));
    }

    @Transactional
    public void resolve(UUID id) {
        var ctx = RequestContextHolder.get();
        var orgId = ctx.orgId();
        var userId = ctx.userId();

        var incident = incidentRepo.findByIdAndOrgId(id, orgId)
                .orElseThrow(() -> new NoSuchElementException("incident not found"));

        var prevStatus = incident.getStatus();
        var now = Instant.now();
        incident.setStatus(IncidentStatus.RESOLVED);
        incident.setUpdatedAt(now);
        incident.setResolvedAt(now);
        incidentRepo.save(incident);

        var meta = om.valueToTree(new LinkedHashMap<String, Object>() {{
            put("previousStatus", prevStatus.name());
            put("status", incident.getStatus().name());
        }});
        var timeline = timelineRepo.save(
                IncidentTimelineEventEntity.create(orgId, incident.getId(), "INCIDENT_RESOLVED", "Incident resolved", userId, meta)
        );

        var payload = om.valueToTree(new LinkedHashMap<String, Object>() {{
            put("orgId", orgId.toString());
            put("incidentId", incident.getId().toString());
            put("timelineEventId", timeline.getId().toString());
            put("type", "INCIDENT_RESOLVED");
            put("previousStatus", prevStatus.name());
            put("status", incident.getStatus().name());
        }});
        outboxRepo.save(OutboxEventEntity.create(orgId, "INCIDENT", incident.getId(), "INCIDENT_RESOLVED", payload));
    }

    @Transactional
    public void changeSeverity(UUID id, IncidentSeverity newSeverity) {
        var ctx = RequestContextHolder.get();
        var orgId = ctx.orgId();
        var userId = ctx.userId();

        var incident = incidentRepo.findByIdAndOrgId(id, orgId)
                .orElseThrow(() -> new NoSuchElementException("incident not found"));

        var prevSeverity = incident.getSeverity();
        incident.setSeverity(newSeverity);
        incident.setUpdatedAt(Instant.now());
        incidentRepo.save(incident);

        var meta = om.valueToTree(new LinkedHashMap<String, Object>() {{
            put("previousSeverity", prevSeverity.name());
            put("severity", newSeverity.name());
        }});
        var timeline = timelineRepo.save(
                IncidentTimelineEventEntity.create(orgId, incident.getId(), "INCIDENT_SEVERITY_CHANGED", "Severity changed to " + newSeverity.name(), userId, meta)
        );

        var payload = om.valueToTree(new LinkedHashMap<String, Object>() {{
            put("orgId", orgId.toString());
            put("incidentId", incident.getId().toString());
            put("timelineEventId", timeline.getId().toString());
            put("type", "INCIDENT_SEVERITY_CHANGED");
            put("previousSeverity", prevSeverity.name());
            put("severity", newSeverity.name());
        }});
        outboxRepo.save(OutboxEventEntity.create(orgId, "INCIDENT", incident.getId(), "INCIDENT_SEVERITY_CHANGED", payload));
    }

    public List<IncidentEntity> list() {
        var orgId = RequestContextHolder.get().orgId();
        return incidentRepo.findAllByOrgId(orgId);
    }

    public IncidentEntity getById(UUID id) {
        var orgId = RequestContextHolder.get().orgId();
        return incidentRepo.findByIdAndOrgId(id, orgId)
                .orElseThrow(() -> new NoSuchElementException("incident not found"));
    }

    public record Result(UUID incidentId) {}
}