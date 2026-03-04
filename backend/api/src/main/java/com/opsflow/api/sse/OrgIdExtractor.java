package com.opsflow.api.sse;

import java.lang.reflect.Method;
import java.util.Map;
import java.util.UUID;
import org.springframework.security.core.Authentication;

public final class OrgIdExtractor {
  private OrgIdExtractor() {}

  public static UUID from(Authentication auth) {
    if (auth == null) throw new IllegalStateException("Missing Authentication");

    Object principal = auth.getPrincipal();
    if (principal == null) throw new IllegalStateException("Missing principal");

    // 1) Map-backed principal (common for custom JWT parsing)
    if (principal instanceof Map<?, ?> m) {
      Object v = m.get("org_id");
      if (v == null) v = m.get("orgId");
      if (v != null) return UUID.fromString(v.toString());
    }

    // 2) Custom principal with getOrgId()/orgId() method
    UUID viaMethod = tryUuidMethod(principal, "getOrgId");
    if (viaMethod != null) return viaMethod;
    viaMethod = tryUuidMethod(principal, "orgId");
    if (viaMethod != null) return viaMethod;

    // 3) Sometimes claims are stored in auth.details
    Object details = auth.getDetails();
    if (details instanceof Map<?, ?> dm) {
      Object v = dm.get("org_id");
      if (v == null) v = dm.get("orgId");
      if (v != null) return UUID.fromString(v.toString());
    }

    throw new IllegalStateException(
        "Cannot extract orgId from principal type: " + principal.getClass().getName()
    );
  }

  private static UUID tryUuidMethod(Object target, String methodName) {
    try {
      Method m = target.getClass().getMethod(methodName);
      Object val = m.invoke(target);
      if (val == null) return null;
      if (val instanceof UUID u) return u;
      return UUID.fromString(val.toString());
    } catch (NoSuchMethodException e) {
      return null;
    } catch (Exception e) {
      throw new IllegalStateException("Failed reading " + methodName + " from principal", e);
    }
  }
}