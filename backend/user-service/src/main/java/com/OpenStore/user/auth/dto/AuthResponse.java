package com.OpenStore.user.auth.dto;

import com.OpenStore.user.user.domain.UserRole;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AuthResponse {
    private String token;
    private Long id;
    private String name;
    private String email;
    private UserRole role;
}
