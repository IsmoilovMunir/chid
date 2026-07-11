package com.chid.mortgage.repository;

import com.chid.mortgage.entity.Client;
import com.chid.mortgage.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ClientRepository extends JpaRepository<Client, Long> {
    List<Client> findByAssignedUserOrderByCreatedAtDesc(User user);
    List<Client> findAllByOrderByCreatedAtDesc();
    List<Client> findByFullNameContainingIgnoreCaseOrPhoneContaining(String name, String phone);
}
