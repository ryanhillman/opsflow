package com.opsflow.api.auth.api;

import com.opsflow.api.auth.model.RefreshToken;
import com.opsflow.api.auth.model.User;
import com.opsflow.api.auth.repo.RefreshTokenRepo;
import com.opsflow.api.auth.repo.UserRepo;
import com.opsflow.api.auth.service.TokenHash;
import com.opsflow.api.common.web.JwtConfig;
import com.opsflow.api.common.web.JwtService;
import com.opsflow.api.rbac.model.Role;
import com.opsflow.api.tenancy.model.OrgMembership;
import com.opsflow.api.tenancy.repo.OrgMembershipRepo;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final UserRepo userRepo;
    private final OrgMembershipRepo membershipRepo;
    private final RefreshTokenRepo refreshTokenRepo;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final JwtConfig jwtConfig;

    public AuthController(
            UserRepo userRepo,
            OrgMembershipRepo membershipRepo,
            RefreshTokenRepo refreshTokenRepo,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            JwtConfig jwtConfig
    ) {
        this.userRepo = userRepo;
        this.membershipRepo = membershipRepo;
        this.refreshTokenRepo = refreshTokenRepo;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.jwtConfig = jwtConfig;
    }

    public record LoginRequest(
            @Email @NotBlank String email,
            @NotBlank String password,
            String orgId
    ) {}

    public record LoginResponse(
            String accessToken,
            String refreshToken,
            String orgId,
            String role
    ) {}

    @PostMapping("/login")
    public LoginResponse login(@Valid @RequestBody LoginRequest req) {
        User user = userRepo.findByEmailIgnoreCase(req.email())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "invalid credentials"));

        if (!passwordEncoder.matches(req.password(), user.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "invalid credentials");
        }

        List<OrgMembership> memberships = membershipRepo.findByUserId(user.getId());
        if (memberships.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "no organization membership");
        }

        OrgMembership chosen = chooseOrg(memberships, req.orgId());

        Role role = Role.valueOf(chosen.getRole());
        UUID orgId = chosen.getOrgId();

        String access = jwtService.createAccessToken(user.getId(), orgId, role, user.getEmail());

        String refreshRaw = UUID.randomUUID().toString() + "." + UUID.randomUUID(); // simple, random enough for MVP
        String refreshHash = TokenHash.sha256B64Url(refreshRaw);

        OffsetDateTime expires = OffsetDateTime.now().plusDays(jwtConfig.refreshTokenTtlDays());
        refreshTokenRepo.save(new RefreshToken(UUID.randomUUID(), user.getId(), orgId, refreshHash, expires));

        return new LoginResponse(access, refreshRaw, orgId.toString(), role.name());
    }

    public record RefreshRequest(@NotBlank String refreshToken) {}
    public record RefreshResponse(String accessToken, String refreshToken) {}

    @PostMapping("/refresh")
    public RefreshResponse refresh(@Valid @RequestBody RefreshRequest req) {
        String hash = TokenHash.sha256B64Url(req.refreshToken());
        RefreshToken rt = refreshTokenRepo
                .findByTokenHashAndRevokedAtIsNullAndExpiresAtAfter(hash, OffsetDateTime.now())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "invalid refresh token"));

        // rotate
        rt.revokeNow();
        refreshTokenRepo.save(rt);

        // Need user email + role for access token; simplest: load user + membership for same org.
        User user = userRepo.findById(rt.getUserId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "invalid refresh token"));

        OrgMembership membership = membershipRepo.findById(new com.opsflow.api.tenancy.model.OrgMembershipId(rt.getOrgId(), rt.getUserId()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "invalid refresh token"));

        Role role = Role.valueOf(membership.getRole());

        String access = jwtService.createAccessToken(user.getId(), rt.getOrgId(), role, user.getEmail());

        String newRefreshRaw = UUID.randomUUID().toString() + "." + UUID.randomUUID();
        String newRefreshHash = TokenHash.sha256B64Url(newRefreshRaw);
        OffsetDateTime expires = OffsetDateTime.now().plusDays(jwtConfig.refreshTokenTtlDays());
        refreshTokenRepo.save(new RefreshToken(UUID.randomUUID(), user.getId(), rt.getOrgId(), newRefreshHash, expires));

        return new RefreshResponse(access, newRefreshRaw);
    }

    private static OrgMembership chooseOrg(List<OrgMembership> memberships, String requestedOrgId) {
        if (memberships.size() == 1) return memberships.get(0);

        if (requestedOrgId == null || requestedOrgId.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "orgId required");
        }

        UUID orgId;
        try {
            orgId = UUID.fromString(requestedOrgId);
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "orgId must be a UUID");
        }

        return memberships.stream()
                .filter(m -> m.getOrgId().equals(orgId))
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "not a member of orgId"));
    }
}