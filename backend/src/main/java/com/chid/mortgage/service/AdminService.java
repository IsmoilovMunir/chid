package com.chid.mortgage.service;

import com.chid.mortgage.dto.AdminDashboardResponse;
import com.chid.mortgage.dto.ClientResponse;
import com.chid.mortgage.dto.CreateRealtorRequest;
import com.chid.mortgage.dto.DeleteRealtorRequest;
import com.chid.mortgage.dto.RealtorAccessRequest;
import com.chid.mortgage.dto.RealtorUserResponse;
import com.chid.mortgage.dto.UpdateRealtorRequest;
import com.chid.mortgage.entity.Client;
import com.chid.mortgage.entity.User;
import com.chid.mortgage.entity.UserRole;
import com.chid.mortgage.repository.CalculationRepository;
import com.chid.mortgage.repository.ClientRepository;
import com.chid.mortgage.repository.LeadRepository;
import com.chid.mortgage.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final ClientRepository clientRepository;
    private final CalculationRepository calculationRepository;
    private final LeadRepository leadRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional(readOnly = true)
    public AdminDashboardResponse getDashboard() {
        long realtorsCount = userRepository.countByRoleAndRealtorAndActive(UserRole.REALTOR, true, true);

        return AdminDashboardResponse.builder()
                .clientsCount(clientRepository.count())
                .calculationsCount(calculationRepository.count())
                .leadsCount(leadRepository.count())
                .realtorsCount(realtorsCount)
                .build();
    }

    @Transactional(readOnly = true)
    public List<RealtorUserResponse> listRealtors(Boolean activeOnly) {
        List<User> realtors = activeOnly != null && activeOnly
                ? userRepository.findByRoleAndActiveOrderByCreatedAtDesc(UserRole.REALTOR, true)
                : userRepository.findByRoleOrderByCreatedAtDesc(UserRole.REALTOR);

        return realtors.stream()
                .map(this::toRealtorResponse)
                .toList();
    }

    @Transactional
    public RealtorUserResponse createRealtor(CreateRealtorRequest request) {
        String email = request.getEmail().trim().toLowerCase();

        if (userRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("Пользователь с таким email уже существует");
        }

        if (!request.isRealtor() && !request.isBroker()) {
            throw new IllegalArgumentException("Укажите хотя бы одну роль: риелтор или брокер");
        }

        User realtor = User.builder()
                .email(email)
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName().trim())
                .phone(request.getPhone().trim())
                .role(UserRole.REALTOR)
                .active(true)
                .realtor(request.isRealtor())
                .broker(request.isBroker())
                .build();

        return toRealtorResponse(userRepository.save(realtor));
    }

    @Transactional
    public RealtorUserResponse updateRealtor(Long id, UpdateRealtorRequest request) {
        User realtor = getRealtor(id);
        String email = request.getEmail().trim().toLowerCase();

        if (!request.isRealtor() && !request.isBroker()) {
            throw new IllegalArgumentException("Укажите хотя бы одну роль: риелтор или брокер");
        }

        if (!email.equals(realtor.getEmail()) && userRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("Пользователь с таким email уже существует");
        }

        if (!request.isRealtor() && realtor.isRealtor()) {
            long clientsCount = clientRepository.countByAssignedUser(realtor);
            if (clientsCount > 0) {
                throw new IllegalArgumentException(
                        "У сотрудника " + clientsCount + " клиент(ов). Сначала передайте клиентов другому риелтору."
                );
            }
        }

        realtor.setFullName(request.getFullName().trim());
        realtor.setPhone(request.getPhone().trim());
        realtor.setEmail(email);
        realtor.setRealtor(request.isRealtor());
        realtor.setBroker(request.isBroker());

        if (request.getPassword() != null && !request.getPassword().isBlank()) {
            realtor.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        }

        return toRealtorResponse(userRepository.save(realtor));
    }

    @Transactional
    public RealtorUserResponse updateRealtorAccess(Long id, RealtorAccessRequest request) {
        User realtor = getRealtor(id);

        if (request.isActive()) {
            realtor.setActive(true);
            return toRealtorResponse(userRepository.save(realtor));
        }

        long clientsCount = clientRepository.countByAssignedUser(realtor);
        if (clientsCount > 0) {
            if (request.getReassignToUserId() == null) {
                throw new IllegalArgumentException(
                        "У риелтора " + clientsCount + " клиент(ов). Передайте их другому риелтору перед блокировкой."
                );
            }
            User target = getActiveRealtor(request.getReassignToUserId());
            if (target.getId().equals(realtor.getId())) {
                throw new IllegalArgumentException("Нельзя передать клиентов тому же риелтору");
            }
            calculationRepository.reassignCalculations(realtor, target);
            clientRepository.reassignAllClients(realtor, target);
        }

        realtor.setActive(false);
        return toRealtorResponse(userRepository.save(realtor));
    }

    @Transactional(readOnly = true)
    public List<ClientResponse> listRealtorClients(Long id) {
        User realtor = getRealtor(id);
        return clientRepository.findByAssignedUserOrderByCreatedAtDesc(realtor).stream()
                .map(this::toClientResponse)
                .toList();
    }

    @Transactional
    public void deleteRealtor(Long id, DeleteRealtorRequest request) {
        User realtor = getRealtor(id);
        List<Client> clients = clientRepository.findByAssignedUserOrderByCreatedAtDesc(realtor);

        if (!clients.isEmpty()) {
            Map<Long, Long> assignments = new HashMap<>();
            if (request.getReassignments() != null) {
                for (DeleteRealtorRequest.ClientReassignment item : request.getReassignments()) {
                    assignments.put(item.getClientId(), item.getAssignToUserId());
                }
            }

            Set<Long> clientIds = new HashSet<>();
            for (Client client : clients) {
                clientIds.add(client.getId());
                Long assignToUserId = assignments.get(client.getId());
                if (assignToUserId == null) {
                    throw new IllegalArgumentException(
                            "Назначьте нового риелтора для клиента «" + client.getFullName() + "»"
                    );
                }
                if (assignToUserId.equals(realtor.getId())) {
                    throw new IllegalArgumentException("Нельзя назначить клиента удаляемому сотруднику");
                }
                User target = getActiveRealtor(assignToUserId);
                client.setAssignedUser(target);
                clientRepository.save(client);
                calculationRepository.reassignCalculationsForClient(client, target);
            }

            for (Long assignedClientId : assignments.keySet()) {
                if (!clientIds.contains(assignedClientId)) {
                    throw new IllegalArgumentException("Клиент #" + assignedClientId + " не принадлежит этому сотруднику");
                }
            }
        }

        calculationRepository.clearCreatedBy(realtor);
        clientRepository.clearBrokerAssignments(realtor);
        userRepository.delete(realtor);
    }

    private ClientResponse toClientResponse(Client client) {
        return ClientResponse.builder()
                .id(client.getId())
                .fullName(client.getFullName())
                .phone(client.getPhone())
                .email(client.getEmail())
                .source(client.getSource())
                .status(client.getStatus())
                .comment(client.getComment())
                .assignedUserId(client.getAssignedUser().getId())
                .assignedUserName(client.getAssignedUser().getFullName())
                .brokerUserId(client.getAssignedBroker() != null ? client.getAssignedBroker().getId() : null)
                .brokerName(client.getAssignedBroker() != null ? client.getAssignedBroker().getFullName() : null)
                .createdAt(client.getCreatedAt())
                .updatedAt(client.getUpdatedAt())
                .build();
    }

    private User getRealtor(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Риелтор не найден"));
        if (user.getRole() != UserRole.REALTOR) {
            throw new IllegalArgumentException("Пользователь не является риелтором");
        }
        return user;
    }

    private User getActiveRealtor(Long id) {
        User user = getRealtor(id);
        if (!user.isActive()) {
            throw new IllegalArgumentException("Риелтор неактивен — нельзя назначить клиентов");
        }
        if (!user.isRealtor()) {
            throw new IllegalArgumentException("Сотрудник не является риелтором — нельзя назначить клиентов");
        }
        return user;
    }

    private RealtorUserResponse toRealtorResponse(User user) {
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
