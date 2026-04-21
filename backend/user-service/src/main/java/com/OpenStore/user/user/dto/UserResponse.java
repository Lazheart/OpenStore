package com.OpenStore.user.user.dto;

import com.OpenStore.user.user.domain.UserRole;
import lombok.Builder;
import lombok.Data;
import java.util.UUID;

@Data
@Builder
public class UserResponse {
    private UUID uid;
    private String name;
    private String email;
    private String phoneNumber;
    private UserRole role;
    private Long shopId;
}
