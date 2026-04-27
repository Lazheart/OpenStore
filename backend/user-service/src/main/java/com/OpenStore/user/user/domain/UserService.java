package com.OpenStore.user.user.domain;

import com.OpenStore.user.user.domain.User;
import com.OpenStore.user.user.domain.UserRole;
import com.OpenStore.user.user.domain.SubscriptionPlan;

import com.OpenStore.user.user.dto.UpdateUserRequest;
import com.OpenStore.user.user.dto.UpdateMeRequest;
import com.OpenStore.user.user.dto.MeResponse;
import com.OpenStore.user.user.dto.OwnerUserResponse;
import com.OpenStore.user.user.dto.UserResponse;
import com.OpenStore.user.user.repository.UserRepository;
import com.OpenStore.user.verification.PasswordResetToken;
import com.OpenStore.user.verification.PasswordResetTokenRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
public class UserService implements UserDetailsService {

    private final UserRepository userRepository;
    private final PasswordResetTokenRepository resetTokenRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository,
                       PasswordResetTokenRepository resetTokenRepository,
                       PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.resetTokenRepository = resetTokenRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + email));
    }

    public List<UserResponse> findAll() {
        return userRepository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    public Page<OwnerUserResponse> listOwners(int page, int size) {
        int safePage = Math.max(page, 0);
        int safeSize = Math.min(Math.max(size, 1), 100);
        return userRepository.findByRole(UserRole.OWNER, PageRequest.of(safePage, safeSize))
                .map(this::toOwnerResponse);
    }

    public UserResponse findById(UUID id) {
        return userRepository.findById(id)
                .map(this::toResponse)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + id));
    }

    public UserResponse update(UUID id, UpdateUserRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + id));

        if (request.getName() != null) user.setName(request.getName());
        if (request.getPhoneNumber() != null) user.setPhoneNumber(request.getPhoneNumber());

        return toResponse(userRepository.save(user));
    }

    public void delete(UUID id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + id));
        user.setEnabled(false);
        userRepository.save(user);
    }

    public MeResponse getMe(String email) {
        User currentUser = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        return MeResponse.builder()
                .id(currentUser.getId())
                .role(currentUser.getRole())
                .subscriptions(currentUser.getSubscription())
                .phoneNumber(currentUser.getPhoneNumber())
                .build();
    }

    @Transactional
    public void updateOwnerSubscriptionByAdmin(UUID id, SubscriptionPlan subscription) {
        User owner = userRepository.findById(id)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + id));

        if (owner.getRole() != UserRole.OWNER) {
            throw new IllegalArgumentException("Este endpoint solo sirve para los OWNER");
        }

        owner.setSubscription(subscription);
        userRepository.save(owner);
    }

    @Transactional
    public void updateMyOwnerSubscription(String email, SubscriptionPlan subscription) {
        User owner = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        if (owner.getRole() != UserRole.OWNER) {
            throw new IllegalArgumentException("Este endpoint solo sirve para los OWNER");
        }

        owner.setSubscription(subscription);
        userRepository.save(owner);
    }

    @Transactional
    public void updateMe(String email, UpdateMeRequest request) {
        User currentUser = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        if (request.getCode() == null || request.getCode().isBlank()) {
            throw new IllegalArgumentException("El codigo es obligatorio");
        }

        PasswordResetToken token = resetTokenRepository.findByCode(request.getCode())
                .orElseThrow(() -> new IllegalArgumentException("Codigo invalido"));

        if (!token.getUser().getId().equals(currentUser.getId())) {
            throw new IllegalArgumentException("Codigo invalido para este usuario");
        }

        if (token.isUsed()) {
            throw new IllegalArgumentException("Codigo ya fue usado");
        }

        if (token.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Codigo expirado");
        }

        if (request.getName() != null && !request.getName().isBlank()) {
            currentUser.setName(request.getName());
        }

        if (request.getEmail() != null && !request.getEmail().isBlank()) {
            String normalizedEmail = request.getEmail().trim().toLowerCase(Locale.ROOT);
            userRepository.findByEmail(normalizedEmail)
                    .filter(existing -> !existing.getId().equals(currentUser.getId()))
                    .ifPresent(existing -> {
                        throw new IllegalArgumentException("Email already in use");
                    });
            currentUser.setEmail(normalizedEmail);
        }

        if (request.getPassword() != null && !request.getPassword().isBlank()) {
            currentUser.setPassword(passwordEncoder.encode(request.getPassword()));
            currentUser.setTokenVersion(currentUser.getTokenVersion() + 1);
        }

        token.setUsed(true);
        resetTokenRepository.save(token);
        userRepository.save(currentUser);
    }

    private UserResponse toResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .phoneNumber(user.getPhoneNumber())
                .role(user.getRole())
                .subscription(user.getSubscription())
                .shopId(user.getShopId())
                .build();
    }

    private OwnerUserResponse toOwnerResponse(User user) {
        return OwnerUserResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .phone(user.getPhoneNumber())
                .subscription(user.getSubscription())
                .build();
    }
}
