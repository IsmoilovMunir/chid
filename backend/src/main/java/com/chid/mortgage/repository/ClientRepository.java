package com.chid.mortgage.repository;

import com.chid.mortgage.entity.Client;
import com.chid.mortgage.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ClientRepository extends JpaRepository<Client, Long> {
    List<Client> findByAssignedUserOrderByCreatedAtDesc(User user);
    List<Client> findByAssignedBrokerOrderByCreatedAtDesc(User user);

    @Query("""
            SELECT DISTINCT c FROM Client c
            WHERE c.assignedUser = :user OR c.assignedBroker = :user
            ORDER BY c.createdAt DESC
            """)
    List<Client> findAccessibleByUser(@Param("user") User user);

    List<Client> findAllByOrderByCreatedAtDesc();
    List<Client> findByFullNameContainingIgnoreCaseOrPhoneContaining(String name, String phone);
    long countByAssignedUser(User user);
    long countByAssignedBroker(User user);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE Client c SET c.assignedUser = :toUser WHERE c.assignedUser = :fromUser")
    int reassignAllClients(@Param("fromUser") User fromUser, @Param("toUser") User toUser);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE Client c SET c.assignedBroker = null WHERE c.assignedBroker = :user")
    int clearBrokerAssignments(@Param("user") User user);
}
