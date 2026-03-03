package com.opsflow.api.common.web;

import com.opsflow.api.rbac.model.Role;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Base64;
import java.util.Map;
import java.util.UUID;

public class JwtService {
    private final JwtConfig cfg;

    public JwtService(JwtConfig cfg) {
        this.cfg = cfg;
    }

    public String createAccessToken(UUID userId, UUID orgId, Role role, String email) {
        Instant now = Instant.now();
        Instant exp = now.plusSeconds(cfg.accessTokenTtlMinutes() * 60L);

        Map<String, Object> payload = Map.of(
                "iss", cfg.issuer(),
                "sub", userId.toString(),
                "org_id", orgId.toString(),
                "role", role.name(),
                "email", email,
                "iat", now.getEpochSecond(),
                "exp", exp.getEpochSecond()
        );

        return sign(payload);
    }

    public VerifiedJwt verify(String token) {
        String[] parts = token.split("\\.");
        if (parts.length != 3) throw new IllegalArgumentException("invalid jwt");

        String headerB64 = parts[0];
        String payloadB64 = parts[1];
        String sigB64 = parts[2];

        String data = headerB64 + "." + payloadB64;
        String expected = hmacSha256B64Url(data, cfg.secret());
        if (!constantTimeEquals(expected, sigB64)) throw new IllegalArgumentException("invalid signature");

        String payloadJson = new String(Base64.getUrlDecoder().decode(payloadB64), StandardCharsets.UTF_8);
        Json tiny = Json.parse(payloadJson);

        long exp = tiny.getLong("exp");
        if (Instant.now().getEpochSecond() >= exp) throw new IllegalArgumentException("token expired");

        return new VerifiedJwt(
                tiny.getString("sub"),
                tiny.getString("org_id"),
                tiny.getString("role"),
                tiny.getString("email")
        );
    }

    private String sign(Map<String, Object> payload) {
        String headerJson = "{\"alg\":\"HS256\",\"typ\":\"JWT\"}";
        String payloadJson = Json.stringify(payload);

        String headerB64 = Base64.getUrlEncoder().withoutPadding().encodeToString(headerJson.getBytes(StandardCharsets.UTF_8));
        String payloadB64 = Base64.getUrlEncoder().withoutPadding().encodeToString(payloadJson.getBytes(StandardCharsets.UTF_8));
        String data = headerB64 + "." + payloadB64;
        String sig = hmacSha256B64Url(data, cfg.secret());
        return data + "." + sig;
    }

    private static String hmacSha256B64Url(String data, String secret) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] sig = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            return Base64.getUrlEncoder().withoutPadding().encodeToString(sig);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    private static boolean constantTimeEquals(String a, String b) {
        if (a.length() != b.length()) return false;
        int r = 0;
        for (int i = 0; i < a.length(); i++) r |= a.charAt(i) ^ b.charAt(i);
        return r == 0;
    }

    public record VerifiedJwt(String userId, String orgId, String role, String email) {}
}