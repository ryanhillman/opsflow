package com.opsflow.api.dev;

import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

public class HashGenTest {

    @Test
    void printHash() {
        var enc = new BCryptPasswordEncoder();
        System.out.println("BCrypt(devpass123)=" + enc.encode("devpass123"));
    }
}
