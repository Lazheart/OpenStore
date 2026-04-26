package com.OpenStore.user.user.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;

import com.OpenStore.user.user.domain.User;
import com.OpenStore.user.user.domain.UserRole;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    Optional<User> findByPhoneNumber(String phoneNumber);
    Optional<User> findByName(String name);
    Optional<User> findByNameIgnoreCase(String name);
    Page<User> findByRole(UserRole role, Pageable pageable);
}
