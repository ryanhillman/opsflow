package com.opsflow.api.services.api;

import com.opsflow.api.common.web.RequestContextHolder;
import com.opsflow.api.services.repo.ServiceRepo;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/services")
public class ServiceController {

    private final ServiceRepo serviceRepo;

    public ServiceController(ServiceRepo serviceRepo) {
        this.serviceRepo = serviceRepo;
    }

    public record ServiceDto(UUID id, String name) {}

    @GetMapping
    public List<ServiceDto> list() {
        var orgId = RequestContextHolder.get().orgId();
        return serviceRepo.findAllByOrgId(orgId).stream()
                .map(s -> new ServiceDto(s.getId(), s.getName()))
                .toList();
    }
}
