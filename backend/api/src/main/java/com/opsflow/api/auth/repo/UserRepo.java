package com.opsflow.api.auth.repo;

import com.opsflow.api.auth.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface UserRepo extends JpaRepository<User, UUID> {
    Optional<User> findByEmailIgnoreCase(String email);
}