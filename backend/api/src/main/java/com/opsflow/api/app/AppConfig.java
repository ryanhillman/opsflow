package com.opsflow.api.app;

import com.opsflow.api.common.web.JwtConfig;
import com.opsflow.api.common.web.JwtService;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

@Configuration
@EnableConfigurationProperties(JwtConfig.class)
public class AppConfig {

    @Bean
    public JwtService jwtService(JwtConfig cfg) {
        return new JwtService(cfg);
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}