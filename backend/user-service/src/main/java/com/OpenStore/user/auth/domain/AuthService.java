package com.OpenStore.user.auth.domain;

import com.OpenStore.user.auth.dto.AuthResponse;
import com.OpenStore.user.auth.dto.LoginRequest;
import com.OpenStore.user.auth.dto.RegisterRequest;
import com.OpenStore.user.auth.dto.ShopRegisterRequest;
import com.OpenStore.user.config.JwtUtil;
import com.OpenStore.user.user.domain.SubscriptionPlan;
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
import java.util.Locale;
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
        return createOwnerUser(request);
    }

    @Transactional
    public AuthResponse registerShopUser(Long shopId, ShopRegisterRequest request) {
        if (shopId == null) {
            throw new IllegalArgumentException("Shop id is required");
        }
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new IllegalArgumentException("Email already in use");
        }

        String generatedName = request.getEmail().split("@")[0];
        User user = User.builder()
                .name(generatedName)
                .email(request.getEmail().trim().toLowerCase(Locale.ROOT))
                .phoneNumber(request.getPhone())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(UserRole.USER)
                .shopId(shopId)
                .emailVerified(true)
                .build();

        userRepository.save(user);
        return toResponse(user, jwtUtil.generateToken(user));
    }

    public AuthResponse login(LoginRequest request) {
        User user = findByIdentifier(request.getIdentifier());

        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(user.getEmail(), request.getPassword())
        );

        return toResponse(user, jwtUtil.generateToken(user));
    }

    public AuthResponse loginShopUser(Long shopId, LoginRequest request) {
        User user = findByIdentifier(request.getIdentifier());

        if (user.getRole() == UserRole.ADMIN || user.getRole() == UserRole.OWNER) {
            throw new IllegalStateException("Ningun admin u owner se puede logear en su propia tienda");
        }

        if (user.getRole() != UserRole.USER) {
            throw new IllegalStateException("Solo usuarios de tienda pueden usar este endpoint");
        }

        if (user.getShopId() == null || !user.getShopId().equals(shopId)) {
            throw new IllegalStateException("Usuario no pertenece a la tienda indicada");
        }

        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(user.getEmail(), request.getPassword())
        );

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
                emailService.sendPasswordResetEmail(user.getEmail(), user.getName(), resetToken.getCode(), resetTokenExpirationMinutes);
            } catch (MessagingException e) {
                throw new RuntimeException("Failed to send password reset email. Please try again later.", e);
            }
        });
    }

    public void verifyRecoveryCode(String code) {
        PasswordResetToken resetToken = resetTokenRepository.findByCode(code)
                .orElseThrow(() -> new IllegalArgumentException("Codigo invalido"));

        if (resetToken.isUsed()) {
            throw new IllegalArgumentException("Codigo ya fue usado");
        }

        if (resetToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Codigo expirado");
        }
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

    private AuthResponse createOwnerUser(RegisterRequest request) {
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new IllegalArgumentException("Email already in use");
        }

        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail().trim().toLowerCase(Locale.ROOT))
                .phoneNumber(request.getPhone())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(UserRole.OWNER)
                .subscription(SubscriptionPlan.FREE)
                .emailVerified(true)
                .build();

        userRepository.save(user);

        return toResponse(user, jwtUtil.generateToken(user));
    }

    private User findByIdentifier(String identifier) {
        if (identifier == null || identifier.isBlank()) {
            throw new IllegalArgumentException("Identifier is required");
        }

        String value = identifier.trim();

        if (value.contains("@")) {
            return userRepository.findByEmail(value.toLowerCase(Locale.ROOT))
                    .orElseThrow(() -> new UsernameNotFoundException("User not found"));
        }

        try {
            UUID uid = UUID.fromString(value);
            return userRepository.findByUid(uid)
                    .orElseThrow(() -> new UsernameNotFoundException("User not found"));
        } catch (IllegalArgumentException ignored) {
            try {
                Long id = Long.valueOf(value);
                return userRepository.findById(id)
                        .orElseThrow(() -> new UsernameNotFoundException("User not found"));
            } catch (NumberFormatException ignoredAgain) {
                return userRepository.findByNameIgnoreCase(value)
                        .orElseThrow(() -> new UsernameNotFoundException("User not found"));
            }
        }
    }

    private EmailVerificationToken buildVerificationToken(User user) {
        return EmailVerificationToken.builder()
                .token(UUID.randomUUID())
                .user(user)
                .expiresAt(LocalDateTime.now().plusHours(verificationTokenExpirationHours))
                .build();
    }

    private PasswordResetToken buildResetToken(User user) {
        String code = generateRecoveryCode();
        return PasswordResetToken.builder()
                .token(UUID.randomUUID())
                .code(code)
                .user(user)
                .expiresAt(LocalDateTime.now().plusMinutes(resetTokenExpirationMinutes))
                .build();
    }

    private String generateRecoveryCode() {
        String code;
        do {
            int random = (int) (Math.random() * 900000) + 100000;
            code = Integer.toString(random);
        } while (resetTokenRepository.existsByCodeAndUsedFalse(code));
        return code;
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
