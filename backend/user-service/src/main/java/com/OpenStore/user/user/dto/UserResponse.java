package com.OpenStore.user.user.dto;

import com.OpenStore.user.user.domain.UserRole;
import com.OpenStore.user.user.domain.SubscriptionPlan;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class UserResponse {
    private Long id;
    private String name;
    private String email;
    private String phoneNumber;
    private UserRole role;
    private SubscriptionPlan subscription;
    private Long shopId;
}
