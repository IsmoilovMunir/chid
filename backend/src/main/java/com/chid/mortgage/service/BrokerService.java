package com.chid.mortgage.service;

import com.chid.mortgage.dto.RealtorUserResponse;
import com.chid.mortgage.entity.User;
import com.chid.mortgage.entity.UserRole;
import com.chid.mortgage.repository.ClientRepository;
import com.chid.mortgage.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class BrokerService {

    private final UserRepository userRepository;
    private final ClientRepository clientRepository;

    @Transactional(readOnly = true)
    public List<RealtorUserResponse> listActiveBrokers() {
        return userRepository
                .findByRoleAndBrokerAndActiveOrderByFullNameAsc(UserRole.REALTOR, true, true)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public User resolveActiveBroker(Long brokerUserId) {
        if (brokerUserId == null) {
            return null;
        }
        User broker = userRepository.findById(brokerUserId)
                .orElseThrow(() -> new IllegalArgumentException("Брокер не найден"));
        if (broker.getRole() != UserRole.REALTOR || !broker.isBroker()) {
            throw new IllegalArgumentException("Пользователь не является брокером");
        }
        if (!broker.isActive()) {
            throw new IllegalArgumentException("Брокер неактивен");
        }
        return broker;
    }

    private RealtorUserResponse toResponse(User user) {
        return RealtorUserResponse.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .phone(user.getPhone())
                .email(user.getEmail())
                .createdAt(user.getCreatedAt())
                .active(user.isActive())
                .realtor(user.isRealtor())
                .broker(user.isBroker())
                .clientsCount(clientRepository.countByAssignedUser(user))
                .build();
    }
}
