package com.OpenStore.user.user.controller;

import com.OpenStore.user.user.domain.UserService;
import com.OpenStore.user.user.dto.UpdateUserRequest;
import com.OpenStore.user.user.dto.UserResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<UserResponse>> findAll() {
        return ResponseEntity.ok(userService.findAll());
    }

    @GetMapping("/{uid}")
    @PreAuthorize("hasRole('ADMIN') or authentication.name == @userRepository.findByUid(#uid).map(u -> u.getEmail()).orElse('')")
    public ResponseEntity<UserResponse> findByUid(@PathVariable UUID uid) {
        return ResponseEntity.ok(userService.findByUid(uid));
    }

    @PutMapping("/{uid}")
    @PreAuthorize("hasRole('ADMIN') or authentication.name == @userRepository.findByUid(#uid).map(u -> u.getEmail()).orElse('')")
    public ResponseEntity<UserResponse> update(@PathVariable UUID uid,
                                               @RequestBody UpdateUserRequest request) {
        return ResponseEntity.ok(userService.update(uid, request));
    }

    @DeleteMapping("/{uid}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable UUID uid) {
        userService.delete(uid);
        return ResponseEntity.noContent().build();
    }
}
