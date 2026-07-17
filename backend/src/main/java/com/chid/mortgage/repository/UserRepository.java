package com.chid.mortgage.repository;

import com.chid.mortgage.entity.User;
import com.chid.mortgage.entity.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    List<User> findByRoleOrderByCreatedAtDesc(UserRole role);
    List<User> findByRoleAndActiveOrderByCreatedAtDesc(UserRole role, boolean active);
    List<User> findByRoleAndBrokerAndActiveOrderByFullNameAsc(UserRole role, boolean broker, boolean active);
    long countByRoleAndActive(UserRole role, boolean active);
    long countByRoleAndRealtorAndActive(UserRole role, boolean realtor, boolean active);
}
