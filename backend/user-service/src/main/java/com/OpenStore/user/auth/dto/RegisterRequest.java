package com.OpenStore.user.auth.dto;

import com.OpenStore.user.user.domain.UserRole;
import lombok.Data;

@Data
public class RegisterRequest {
    private String name;
    private String email;
    private String phoneNumber;
    private String password;
    private UserRole role;
}
