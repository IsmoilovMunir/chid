package com.chid.mortgage.repository;

import com.chid.mortgage.entity.Calculation;
import com.chid.mortgage.entity.Client;
import com.chid.mortgage.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CalculationRepository extends JpaRepository<Calculation, Long> {
    List<Calculation> findByCreatedByOrderByCreatedAtDesc(User user);
    List<Calculation> findByClientOrderByCreatedAtDesc(Client client);
    List<Calculation> findAllByOrderByCreatedAtDesc();
    Optional<Calculation> findByPublicToken(String publicToken);
}
