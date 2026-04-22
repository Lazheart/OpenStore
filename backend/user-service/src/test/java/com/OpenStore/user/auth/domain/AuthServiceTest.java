package com.OpenStore.user.auth.domain;

import com.OpenStore.user.auth.dto.AuthResponse;
import com.OpenStore.user.auth.dto.LoginRequest;
import com.OpenStore.user.auth.dto.RegisterRequest;
import com.OpenStore.user.config.JwtUtil;
import com.OpenStore.user.user.domain.User;
import com.OpenStore.user.user.domain.UserRole;
import com.OpenStore.user.user.repository.UserRepository;
import com.OpenStore.user.verification.EmailService;
import com.OpenStore.user.verification.EmailVerificationToken;
import com.OpenStore.user.verification.EmailVerificationTokenRepository;
import com.OpenStore.user.verification.PasswordResetToken;
import com.OpenStore.user.verification.PasswordResetTokenRepository;
import jakarta.mail.MessagingException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private JwtUtil jwtUtil;
    @Mock private AuthenticationManager authenticationManager;
    @Mock private EmailVerificationTokenRepository verificationTokenRepository;
    @Mock private PasswordResetTokenRepository resetTokenRepository;
    @Mock private EmailService emailService;

    @InjectMocks
    private AuthService authService;

    private User user;
    private User verifiedUser;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(authService, "verificationTokenExpirationHours", 24);
        ReflectionTestUtils.setField(authService, "resetTokenExpirationMinutes", 15);

        user = User.builder()
                .name("Carlos")
                .email("carlos@test.com")
                .password("hashed")
                .role(UserRole.CLIENT)
                .build();
        ReflectionTestUtils.setField(user, "uid", UUID.randomUUID());
        ReflectionTestUtils.setField(user, "id", 1L);

        verifiedUser = User.builder()
                .name("Carlos")
                .email("carlos@test.com")
                .password("hashed")
                .role(UserRole.CLIENT)
                .emailVerified(true)
                .build();
        ReflectionTestUtils.setField(verifiedUser, "uid", UUID.randomUUID());
        ReflectionTestUtils.setField(verifiedUser, "id", 1L);
    }

    // ── Register ─────────────────────────────────────────────────────────────

    @Test
    void register_saves_user_and_sends_verification_email() throws MessagingException {
        RegisterRequest request = new RegisterRequest();
        request.setName("Carlos");
        request.setEmail("carlos@test.com");
        request.setPassword("plain");
        request.setRole(UserRole.CLIENT);

        when(userRepository.findByEmail("carlos@test.com")).thenReturn(Optional.empty());
        when(passwordEncoder.encode("plain")).thenReturn("hashed");
        when(userRepository.save(any(User.class))).thenReturn(user);
        when(verificationTokenRepository.save(any(EmailVerificationToken.class))).thenAnswer(inv -> inv.getArgument(0));
        when(jwtUtil.generateToken(any(User.class))).thenReturn("jwt-token");
        doNothing().when(emailService).sendVerificationEmail(anyString(), anyString(), any(UUID.class));

        AuthResponse response = authService.register(request);

        assertThat(response.getToken()).isEqualTo("jwt-token");
        assertThat(response.getEmail()).isEqualTo("carlos@test.com");
        assertThat(response.getRole()).isEqualTo(UserRole.CLIENT);
        verify(userRepository).save(any(User.class));
        verify(verificationTokenRepository).save(any(EmailVerificationToken.class));
        verify(emailService).sendVerificationEmail(anyString(), anyString(), any(UUID.class));
    }

    @Test
    void register_throws_when_email_already_in_use() {
        RegisterRequest request = new RegisterRequest();
        request.setEmail("carlos@test.com");

        when(userRepository.findByEmail("carlos@test.com")).thenReturn(Optional.of(user));

        assertThatThrownBy(() -> authService.register(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Email already in use");
    }

    // ── Login ─────────────────────────────────────────────────────────────────

    @Test
    void login_returns_token_when_email_is_verified() {
        LoginRequest request = new LoginRequest();
        request.setEmail("carlos@test.com");
        request.setPassword("plain");

        when(userRepository.findByEmail("carlos@test.com")).thenReturn(Optional.of(verifiedUser));
        when(jwtUtil.generateToken(any(User.class))).thenReturn("jwt-token");

        AuthResponse response = authService.login(request);

        assertThat(response.getToken()).isEqualTo("jwt-token");
        verify(authenticationManager).authenticate(any(UsernamePasswordAuthenticationToken.class));
    }

    @Test
    void login_throws_when_email_is_not_verified() {
        LoginRequest request = new LoginRequest();
        request.setEmail("carlos@test.com");
        request.setPassword("plain");

        when(userRepository.findByEmail("carlos@test.com")).thenReturn(Optional.of(user));

        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Email not verified");
    }

    @Test
    void login_throws_when_credentials_are_invalid() {
        LoginRequest request = new LoginRequest();
        request.setEmail("carlos@test.com");
        request.setPassword("wrong");

        doThrow(new BadCredentialsException("Bad credentials"))
                .when(authenticationManager).authenticate(any());

        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(BadCredentialsException.class);
    }

    // ── Email Verification ────────────────────────────────────────────────────

    @Test
    void verifyEmail_marks_user_as_verified() {
        UUID token = UUID.randomUUID();
        EmailVerificationToken verificationToken = EmailVerificationToken.builder()
                .token(token)
                .user(user)
                .expiresAt(LocalDateTime.now().plusHours(24))
                .used(false)
                .build();

        when(verificationTokenRepository.findByToken(token)).thenReturn(Optional.of(verificationToken));
        when(userRepository.save(any(User.class))).thenReturn(user);
        when(verificationTokenRepository.save(any(EmailVerificationToken.class))).thenReturn(verificationToken);

        authService.verifyEmail(token);

        assertThat(user.isEmailVerified()).isTrue();
        assertThat(verificationToken.isUsed()).isTrue();
    }

    @Test
    void verifyEmail_throws_when_token_not_found() {
        UUID token = UUID.randomUUID();
        when(verificationTokenRepository.findByToken(token)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.verifyEmail(token))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Invalid verification token");
    }

    @Test
    void verifyEmail_throws_when_token_expired() {
        UUID token = UUID.randomUUID();
        EmailVerificationToken expiredToken = EmailVerificationToken.builder()
                .token(token)
                .user(user)
                .expiresAt(LocalDateTime.now().minusHours(1))
                .used(false)
                .build();

        when(verificationTokenRepository.findByToken(token)).thenReturn(Optional.of(expiredToken));

        assertThatThrownBy(() -> authService.verifyEmail(token))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("expired");
    }

    @Test
    void verifyEmail_throws_when_token_already_used() {
        UUID token = UUID.randomUUID();
        EmailVerificationToken usedToken = EmailVerificationToken.builder()
                .token(token)
                .user(user)
                .expiresAt(LocalDateTime.now().plusHours(24))
                .used(true)
                .build();

        when(verificationTokenRepository.findByToken(token)).thenReturn(Optional.of(usedToken));

        assertThatThrownBy(() -> authService.verifyEmail(token))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("already been used");
    }

    // ── Password Recovery ─────────────────────────────────────────────────────

    @Test
    void forgotPassword_sends_reset_email_when_user_exists() throws MessagingException {
        when(userRepository.findByEmail("carlos@test.com")).thenReturn(Optional.of(user));
        when(resetTokenRepository.save(any(PasswordResetToken.class))).thenAnswer(inv -> inv.getArgument(0));
        doNothing().when(emailService).sendPasswordResetEmail(anyString(), anyString(), any(UUID.class));

        authService.forgotPassword("carlos@test.com");

        verify(resetTokenRepository).deleteByUser_Id(user.getId());
        verify(resetTokenRepository).save(any(PasswordResetToken.class));
        verify(emailService).sendPasswordResetEmail(anyString(), anyString(), any(UUID.class));
    }

    @Test
    void forgotPassword_does_nothing_when_user_not_found() throws MessagingException {
        when(userRepository.findByEmail("unknown@test.com")).thenReturn(Optional.empty());

        authService.forgotPassword("unknown@test.com");

        verify(resetTokenRepository, never()).save(any());
        verify(emailService, never()).sendPasswordResetEmail(anyString(), anyString(), any(UUID.class));
    }

    @Test
    void resetPassword_updates_password_and_invalidates_tokens() {
        UUID token = UUID.randomUUID();
        int originalTokenVersion = user.getTokenVersion();

        PasswordResetToken resetToken = PasswordResetToken.builder()
                .token(token)
                .user(user)
                .expiresAt(LocalDateTime.now().plusMinutes(15))
                .used(false)
                .build();

        when(resetTokenRepository.findByToken(token)).thenReturn(Optional.of(resetToken));
        when(passwordEncoder.encode("NewPass1")).thenReturn("newHashed");
        when(userRepository.save(any(User.class))).thenReturn(user);
        when(resetTokenRepository.save(any(PasswordResetToken.class))).thenReturn(resetToken);

        authService.resetPassword(token, "NewPass1");

        assertThat(user.getPassword()).isEqualTo("newHashed");
        assertThat(user.getTokenVersion()).isEqualTo(originalTokenVersion + 1);
        assertThat(resetToken.isUsed()).isTrue();
    }

    @Test
    void resetPassword_throws_when_token_not_found() {
        UUID token = UUID.randomUUID();
        when(resetTokenRepository.findByToken(token)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.resetPassword(token, "NewPass1"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Invalid password reset token");
    }

    @Test
    void resetPassword_throws_when_token_expired() {
        UUID token = UUID.randomUUID();
        PasswordResetToken expiredToken = PasswordResetToken.builder()
                .token(token)
                .user(user)
                .expiresAt(LocalDateTime.now().minusMinutes(1))
                .used(false)
                .build();

        when(resetTokenRepository.findByToken(token)).thenReturn(Optional.of(expiredToken));

        assertThatThrownBy(() -> authService.resetPassword(token, "NewPass1"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("expired");
    }

    @Test
    void resetPassword_throws_when_token_already_used() {
        UUID token = UUID.randomUUID();
        PasswordResetToken usedToken = PasswordResetToken.builder()
                .token(token)
                .user(user)
                .expiresAt(LocalDateTime.now().plusMinutes(15))
                .used(true)
                .build();

        when(resetTokenRepository.findByToken(token)).thenReturn(Optional.of(usedToken));

        assertThatThrownBy(() -> authService.resetPassword(token, "NewPass1"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("already been used");
    }
}
