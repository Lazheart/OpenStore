package com.OpenStore.user.user.dto;

import com.OpenStore.user.user.domain.SubscriptionPlan;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class OwnerUserResponse {
    private Long id;
    private String name;
    private String email;
    private String phone;
    private SubscriptionPlan subscription;
}
