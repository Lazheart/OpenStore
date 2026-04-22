package com.OpenStore.user.user.domain;

import com.OpenStore.user.user.dto.UpdateUserRequest;
import com.OpenStore.user.user.dto.UserResponse;
import com.OpenStore.user.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private UserService userService;

    private User user;

    @BeforeEach
    void setUp() {
        user = User.builder()
                .name("Carlos")
                .email("carlos@test.com")
                .phoneNumber("1234567890")
                .password("hashed")
                .role(UserRole.CLIENT)
                .build();
        user.onCreate();
    }

    @Test
    void loadUserByUsername_returns_user_when_found() {
        when(userRepository.findByEmail("carlos@test.com")).thenReturn(Optional.of(user));

        var result = userService.loadUserByUsername("carlos@test.com");

        assertThat(result.getUsername()).isEqualTo("carlos@test.com");
    }

    @Test
    void loadUserByUsername_throws_when_not_found() {
        when(userRepository.findByEmail("unknown@test.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.loadUserByUsername("unknown@test.com"))
                .isInstanceOf(UsernameNotFoundException.class);
    }

    @Test
    void findAll_returns_mapped_responses() {
        when(userRepository.findAll()).thenReturn(List.of(user));

        List<UserResponse> result = userService.findAll();

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getEmail()).isEqualTo("carlos@test.com");
    }

    @Test
    void findByUid_returns_response_when_found() {
        when(userRepository.findByUid(user.getUid())).thenReturn(Optional.of(user));

        UserResponse result = userService.findByUid(user.getUid());

        assertThat(result.getUid()).isEqualTo(user.getUid());
    }

    @Test
    void findByUid_throws_when_not_found() {
        UUID uid = UUID.randomUUID();
        when(userRepository.findByUid(uid)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.findByUid(uid))
                .isInstanceOf(UsernameNotFoundException.class);
    }

    @Test
    void update_changes_name_and_phoneNumber() {
        when(userRepository.findByUid(user.getUid())).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenReturn(user);

        UpdateUserRequest request = new UpdateUserRequest();
        request.setName("Nuevo Nombre");
        request.setPhoneNumber("9999999999");

        UserResponse result = userService.update(user.getUid(), request);

        assertThat(result.getName()).isEqualTo("Nuevo Nombre");
        assertThat(result.getPhoneNumber()).isEqualTo("9999999999");
    }

    @Test
    void update_ignores_null_fields() {
        when(userRepository.findByUid(user.getUid())).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenReturn(user);

        UpdateUserRequest request = new UpdateUserRequest();
        request.setName(null);
        request.setPhoneNumber(null);

        UserResponse result = userService.update(user.getUid(), request);

        assertThat(result.getName()).isEqualTo("Carlos");
        assertThat(result.getPhoneNumber()).isEqualTo("1234567890");
    }

    @Test
    void delete_sets_deletedAt_and_disables_user() {
        when(userRepository.findByUid(user.getUid())).thenReturn(Optional.of(user));

        userService.delete(user.getUid());

        assertThat(user.getDeletedAt()).isNotNull();
        assertThat(user.isEnabled()).isFalse();
        verify(userRepository).save(user);
    }
}
