package com.chid.mortgage.repository;

import com.chid.mortgage.entity.Calculation;
import com.chid.mortgage.entity.Client;
import com.chid.mortgage.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface CalculationRepository extends JpaRepository<Calculation, Long> {
    List<Calculation> findByCreatedByOrderByCreatedAtDesc(User user);
    List<Calculation> findByClientOrderByCreatedAtDesc(Client client);
    List<Calculation> findAllByOrderByCreatedAtDesc();
    Optional<Calculation> findByPublicToken(String publicToken);

    @Query("""
            SELECT c FROM Calculation c
            LEFT JOIN c.client cl
            WHERE c.createdBy = :user
               OR cl.assignedUser = :user
               OR cl.assignedBroker = :user
            ORDER BY c.createdAt DESC
            """)
    List<Calculation> findAccessibleByUser(@Param("user") User user);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE Calculation c SET c.createdBy = :toUser WHERE c.createdBy = :fromUser AND c.client.assignedUser = :fromUser")
    int reassignCalculations(@Param("fromUser") User fromUser, @Param("toUser") User toUser);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE Calculation c SET c.createdBy = :toUser WHERE c.client = :client")
    int reassignCalculationsForClient(@Param("client") Client client, @Param("toUser") User toUser);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE Calculation c SET c.createdBy = null WHERE c.createdBy = :user")
    int clearCreatedBy(@Param("user") User user);
}
