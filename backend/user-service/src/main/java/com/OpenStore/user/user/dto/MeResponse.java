package main.java.com.OpenStore.user.user.dto;

import com.OpenStore.user.user.domain.SubscriptionPlan;
import com.OpenStore.user.user.domain.UserRole;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class MeResponse {
    private Long id;
    private UserRole role;
    private SubscriptionPlan subscriptions;
    private String phoneNumber;
}
