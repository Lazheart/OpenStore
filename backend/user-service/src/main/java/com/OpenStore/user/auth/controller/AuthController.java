package com.OpenStore.user.auth.controller;

import com.OpenStore.user.auth.domain.AuthService;
import com.OpenStore.user.auth.dto.AuthResponse;
import com.OpenStore.user.auth.dto.ForgotPasswordRequest;
import com.OpenStore.user.auth.dto.LoginRequest;
import com.OpenStore.user.auth.dto.RegisterRequest;
import com.OpenStore.user.auth.dto.ResetPasswordRequest;
import com.OpenStore.user.auth.dto.ResendVerificationRequest;
import com.OpenStore.user.auth.dto.ShopRegisterRequest;
import com.OpenStore.user.auth.dto.VerifyRecoveryCodeRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping({"/api/auth", "/auth"})
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.register(request));
    }

    @PostMapping("/{shopId}/register")
    public ResponseEntity<AuthResponse> registerShopUser(@PathVariable UUID shopId,
                                                         @Valid @RequestBody ShopRegisterRequest request) {
        return ResponseEntity.ok(authService.registerShopUser(shopId, request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/{shopId}/login")
    public ResponseEntity<AuthResponse> loginShopUser(@PathVariable UUID shopId,
                                                      @Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.loginShopUser(shopId, request));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(Authentication authentication) {
        authService.logout(authentication.getName());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/recovery")
    public ResponseEntity<Map<String, String>> recovery(@Valid @RequestBody ForgotPasswordRequest request) {
        authService.forgotPassword(request.getEmail());
        return ResponseEntity.ok(Map.of("message", "ok"));
    }

    @PostMapping("/verify")
    public ResponseEntity<Map<String, String>> verifyRecoveryCode(@Valid @RequestBody VerifyRecoveryCodeRequest request) {
        authService.verifyRecoveryCode(request.getCode());
        return ResponseEntity.ok(Map.of("message", "Codigo para actualizar datos correcto"));
    }

    @GetMapping("/verify-email")
    public ResponseEntity<Map<String, String>> verifyEmail(@RequestParam UUID token) {
        authService.verifyEmail(token);
        return ResponseEntity.ok(Map.of("message", "Email verified successfully. You can now log in."));
    }

    @PostMapping("/resend-verification")
    public ResponseEntity<Map<String, String>> resendVerification(@Valid @RequestBody ResendVerificationRequest request) {
        authService.resendVerification(request.getEmail());
        return ResponseEntity.ok(Map.of("message", "Verification email sent. Please check your inbox."));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<Map<String, String>> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        authService.forgotPassword(request.getEmail());
        return ResponseEntity.ok(Map.of("message", "ok"));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<Map<String, String>> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request.getToken(), request.getNewPassword());
        return ResponseEntity.ok(Map.of("message", "Password reset successfully. You can now log in with your new password."));
    }
}
