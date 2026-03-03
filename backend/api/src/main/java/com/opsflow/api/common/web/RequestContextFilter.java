package com.opsflow.api.common.web;

import com.opsflow.api.rbac.model.Role;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.UUID;

public class RequestContextFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {

        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.isAuthenticated() && auth.getPrincipal() instanceof JwtPrincipal p) {
                RequestContextHolder.set(new RequestContext(
                        UUID.fromString(p.orgId()),
                        UUID.fromString(p.userId()),
                        Role.valueOf(p.role())
                ));
            }
            chain.doFilter(request, response);
        } finally {
            RequestContextHolder.clear();
        }
    }
}