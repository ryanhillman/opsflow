package com.opsflow.api.common.web;

import com.opsflow.api.rbac.model.Role;

import java.util.UUID;

public record RequestContext(UUID orgId, UUID userId, Role role) {}