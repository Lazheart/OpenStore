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
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;
    private final EmailVerificationTokenRepository verificationTokenRepository;
    private final PasswordResetTokenRepository resetTokenRepository;
    private final EmailService emailService;

    @Value("${app.verification.token-expiration-hours:24}")
    private int verificationTokenExpirationHours;

    @Value("${app.password-reset.token-expiration-minutes:15}")
    private int resetTokenExpirationMinutes;

    public AuthService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       JwtUtil jwtUtil,
                       AuthenticationManager authenticationManager,
                       EmailVerificationTokenRepository verificationTokenRepository,
                       PasswordResetTokenRepository resetTokenRepository,
                       EmailService emailService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
        this.authenticationManager = authenticationManager;
        this.verificationTokenRepository = verificationTokenRepository;
        this.resetTokenRepository = resetTokenRepository;
        this.emailService = emailService;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        return createUser(request, UserRole.CLIENT);
    }

    @Transactional
    public AuthResponse registerPrivileged(RegisterRequest request) {
        return createUser(request, request.getRole());
    }

    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        if (!user.isEmailVerified()) {
            throw new IllegalStateException("Email not verified. Please check your inbox and verify your account before logging in.");
        }

        return toResponse(user, jwtUtil.generateToken(user));
    }

    public void logout(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
        user.setTokenVersion(user.getTokenVersion() + 1);
        userRepository.save(user);
    }

    @Transactional
    public void verifyEmail(UUID token) {
        EmailVerificationToken verificationToken = verificationTokenRepository.findByToken(token)
                .orElseThrow(() -> new IllegalArgumentException("Invalid verification token"));

        if (verificationToken.isUsed()) {
            throw new IllegalArgumentException("Verification token has already been used");
        }

        if (verificationToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Verification token has expired. Please request a new one.");
        }

        User user = verificationToken.getUser();
        user.setEmailVerified(true);
        userRepository.save(user);

        verificationToken.setUsed(true);
        verificationTokenRepository.save(verificationToken);
    }

    @Transactional
    public void resendVerification(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + email));

        if (user.isEmailVerified()) {
            throw new IllegalArgumentException("Email is already verified");
        }

        verificationTokenRepository.deleteByUser_Id(user.getId());

        EmailVerificationToken newToken = buildVerificationToken(user);
        verificationTokenRepository.save(newToken);

        try {
            emailService.sendVerificationEmail(user.getEmail(), user.getName(), newToken.getToken());
        } catch (MessagingException e) {
            throw new RuntimeException("Failed to send verification email. Please try again later.", e);
        }
    }

    // ── Password Recovery ────────────────────────────────────────────────────

    @Transactional
    public void forgotPassword(String email) {
        // We don't throw if user not found to avoid leaking account existence
        userRepository.findByEmail(email).ifPresent(user -> {
            resetTokenRepository.deleteByUser_Id(user.getId());

            PasswordResetToken resetToken = buildResetToken(user);
            resetTokenRepository.save(resetToken);

            try {
                emailService.sendPasswordResetEmail(user.getEmail(), user.getName(), resetToken.getToken());
            } catch (MessagingException e) {
                throw new RuntimeException("Failed to send password reset email. Please try again later.", e);
            }
        });
    }

    @Transactional
    public void resetPassword(UUID token, String newPassword) {
        PasswordResetToken resetToken = resetTokenRepository.findByToken(token)
                .orElseThrow(() -> new IllegalArgumentException("Invalid password reset token"));

        if (resetToken.isUsed()) {
            throw new IllegalArgumentException("Password reset token has already been used");
        }

        if (resetToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Password reset token has expired. Please request a new one.");
        }

        User user = resetToken.getUser();
        user.setPassword(passwordEncoder.encode(newPassword));
        // Invalidate all existing JWT tokens
        user.setTokenVersion(user.getTokenVersion() + 1);
        userRepository.save(user);

        resetToken.setUsed(true);
        resetTokenRepository.save(resetToken);
    }

    // ── Private helpers ──────────────────────────────────────────────────────

    private AuthResponse createUser(RegisterRequest request, UserRole role) {
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new IllegalArgumentException("Email already in use");
        }

        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .phoneNumber(request.getPhoneNumber())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(role)
                .build();

        userRepository.save(user);

        EmailVerificationToken token = buildVerificationToken(user);
        verificationTokenRepository.save(token);

        try {
            emailService.sendVerificationEmail(user.getEmail(), user.getName(), token.getToken());
        } catch (MessagingException e) {
            throw new RuntimeException("Failed to send verification email. Please try again later.", e);
        }

        return toResponse(user, jwtUtil.generateToken(user));
    }

    private EmailVerificationToken buildVerificationToken(User user) {
        return EmailVerificationToken.builder()
                .token(UUID.randomUUID())
                .user(user)
                .expiresAt(LocalDateTime.now().plusHours(verificationTokenExpirationHours))
                .build();
    }

    private PasswordResetToken buildResetToken(User user) {
        return PasswordResetToken.builder()
                .token(UUID.randomUUID())
                .user(user)
                .expiresAt(LocalDateTime.now().plusMinutes(resetTokenExpirationMinutes))
                .build();
    }

    private AuthResponse toResponse(User user, String token) {
        return AuthResponse.builder()
                .token(token)
                .uid(user.getUid())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole())
                .build();
    }
}
