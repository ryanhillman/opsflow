package com.opsflow.api.common.web;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.Map;

public final class Json {
    private static final ObjectMapper M = new ObjectMapper();

    private Json() {}

    public static String stringify(Map<String, Object> m) {
        try { return M.writeValueAsString(m); }
        catch (Exception e) { throw new RuntimeException(e); }
    }

    public static Json parse(String json) {
        try {
            Map<String, Object> m = M.readValue(json, new TypeReference<>() {});
            return new Json(m);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    private final Map<String, Object> m;

    private Json(Map<String, Object> m) { this.m = m; }

    public String getString(String key) { return String.valueOf(m.get(key)); }
    public long getLong(String key) { return Long.parseLong(String.valueOf(m.get(key))); }
}