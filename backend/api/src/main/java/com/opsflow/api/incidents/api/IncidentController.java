package com.opsflow.api.incidents.api;

import com.opsflow.api.incidents.model.IncidentSeverity;
import com.opsflow.api.incidents.service.IncidentService;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/incidents")
public class IncidentController {

    private final IncidentService incidentService;

    public IncidentController(IncidentService incidentService) {
        this.incidentService = incidentService;
    }

    public record CreateIncidentRequest(
            @NotNull UUID serviceId,
            @NotBlank String title,
            @NotNull IncidentSeverity severity
    ) {}

    public record CreateIncidentResponse(UUID id) {}

    @PostMapping
    public CreateIncidentResponse create(@RequestBody CreateIncidentRequest req) {
        var r = incidentService.create(req.serviceId(), req.title(), req.severity());
        return new CreateIncidentResponse(r.incidentId());
    }
}