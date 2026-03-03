package com.opsflow.api.common.web;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "opsflow.security.jwt")
public record JwtConfig(
        String issuer,
        String secret,
        int accessTokenTtlMinutes,
        int refreshTokenTtlDays
) {}