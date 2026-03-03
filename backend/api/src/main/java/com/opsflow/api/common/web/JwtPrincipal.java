package com.opsflow.api.common.web;

public record JwtPrincipal(String userId, String orgId, String role, String email) {}