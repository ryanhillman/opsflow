package com.opsflow.api.rbac.model;

public enum Role {
    OWNER, ADMIN, MEMBER;

    public boolean isAdminish() {
        return this == OWNER || this == ADMIN;
    }
}