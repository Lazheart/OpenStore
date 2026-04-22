package com.OpenStore.user.user.domain;

import org.junit.jupiter.api.Test;
import org.springframework.security.core.GrantedAuthority;

import java.util.Collection;

import static org.assertj.core.api.Assertions.assertThat;

class UserTest {

    @Test
    void uid_is_generated_on_prePersist() {
        User user = User.builder()
                .name("Carlos")
                .email("carlos@test.com")
                .password("hashed")
                .role(UserRole.CLIENT)
                .build();

        user.onCreate();

        assertThat(user.getUid()).isNotNull();
    }

    @Test
    void uid_is_not_overwritten_if_already_set() {
        User user = User.builder()
                .name("Carlos")
                .email("carlos@test.com")
                .password("hashed")
                .role(UserRole.CLIENT)
                .build();

        user.onCreate();
        var originalUid = user.getUid();
        user.onCreate();

        assertThat(user.getUid()).isEqualTo(originalUid);
    }

    @Test
    void getUsername_returns_email() {
        User user = User.builder().email("carlos@test.com").build();
        assertThat(user.getUsername()).isEqualTo("carlos@test.com");
    }

    @Test
    void getAuthorities_returns_role_with_prefix() {
        User user = User.builder().role(UserRole.ADMIN).build();
        Collection<? extends GrantedAuthority> authorities = user.getAuthorities();
        assertThat(authorities).hasSize(1);
        assertThat(authorities.iterator().next().getAuthority()).isEqualTo("ROLE_ADMIN");
    }

    @Test
    void enabled_is_true_by_default() {
        User user = User.builder().build();
        assertThat(user.isEnabled()).isTrue();
    }

    @Test
    void isAccountNonExpired_isAccountNonLocked_isCredentialsNonExpired_are_true() {
        User user = User.builder().build();
        assertThat(user.isAccountNonExpired()).isTrue();
        assertThat(user.isAccountNonLocked()).isTrue();
        assertThat(user.isCredentialsNonExpired()).isTrue();
    }

    @Test
    void equals_and_hashCode_based_on_uid() {
        User user1 = User.builder().name("A").email("a@test.com").role(UserRole.CLIENT).build();
        User user2 = User.builder().name("B").email("b@test.com").role(UserRole.OWNER).build();

        user1.onCreate();
        user2.setUid(user1.getUid());

        assertThat(user1).isEqualTo(user2);
        assertThat(user1.hashCode()).isEqualTo(user2.hashCode());
    }

    @Test
    void users_with_different_uids_are_not_equal() {
        User user1 = User.builder().build();
        User user2 = User.builder().build();
        user1.onCreate();
        user2.onCreate();

        assertThat(user1).isNotEqualTo(user2);
    }
}
