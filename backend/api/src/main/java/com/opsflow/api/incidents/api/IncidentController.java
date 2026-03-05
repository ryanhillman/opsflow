package com.opsflow.api.incidents.api;

import com.opsflow.api.incidents.model.IncidentEntity;
import com.opsflow.api.incidents.model.IncidentSeverity;
import com.opsflow.api.incidents.model.IncidentStatus;
import com.opsflow.api.incidents.service.IncidentService;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/incidents")
public class IncidentController {

    private final IncidentService incidentService;

    public IncidentController(IncidentService incidentService) {
        this.incidentService = incidentService;
    }

    public record IncidentDto(
            UUID id,
            String title,
            IncidentSeverity severity,
            IncidentStatus status,
            Instant createdAt,
            UUID serviceId
    ) {
        static IncidentDto from(IncidentEntity e) {
            return new IncidentDto(e.getId(), e.getTitle(), e.getSeverity(), e.getStatus(), e.getCreatedAt(), e.getServiceId());
        }
    }

    public record CreateIncidentRequest(
            @NotNull UUID serviceId,
            @NotBlank String title,
            @NotNull IncidentSeverity severity
    ) {}

    public record CreateIncidentResponse(UUID id) {}

    public record ChangeSeverityRequest(@NotNull IncidentSeverity severity) {}

    @GetMapping
    public List<IncidentDto> list() {
        return incidentService.list().stream().map(IncidentDto::from).toList();
    }

    @GetMapping("/{id}")
    public IncidentDto get(@PathVariable UUID id) {
        return IncidentDto.from(incidentService.getById(id));
    }

    @PostMapping
    public CreateIncidentResponse create(@RequestBody CreateIncidentRequest req) {
        var r = incidentService.create(req.serviceId(), req.title(), req.severity());
        return new CreateIncidentResponse(r.incidentId());
    }

    @PostMapping("/{id}/ack")
    public ResponseEntity<Void> ack(@PathVariable UUID id) {
        incidentService.ack(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/resolve")
    public ResponseEntity<Void> resolve(@PathVariable UUID id) {
        incidentService.resolve(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/severity")
    public ResponseEntity<Void> changeSeverity(@PathVariable UUID id, @RequestBody ChangeSeverityRequest req) {
        incidentService.changeSeverity(id, req.severity());
        return ResponseEntity.noContent().build();
    }
}