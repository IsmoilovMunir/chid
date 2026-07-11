package com.chid.mortgage.service;

import com.chid.mortgage.dto.ClientRequest;
import com.chid.mortgage.dto.ClientResponse;
import com.chid.mortgage.entity.Client;
import com.chid.mortgage.entity.User;
import com.chid.mortgage.entity.UserRole;
import com.chid.mortgage.repository.ClientRepository;
import com.chid.mortgage.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ClientService {

    private final ClientRepository clientRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<ClientResponse> findAll(String search) {
        User currentUser = getCurrentUser();
        List<Client> clients;

        if (currentUser.getRole() == UserRole.ADMIN) {
            clients = search != null && !search.isBlank()
                    ? clientRepository.findByFullNameContainingIgnoreCaseOrPhoneContaining(search, search)
                    : clientRepository.findAllByOrderByCreatedAtDesc();
        } else {
            clients = clientRepository.findByAssignedUserOrderByCreatedAtDesc(currentUser).stream()
                    .filter(c -> search == null || search.isBlank()
                            || c.getFullName().toLowerCase().contains(search.toLowerCase())
                            || c.getPhone().contains(search))
                    .toList();
        }

        return clients.stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public ClientResponse findById(Long id) {
        Client client = getAccessibleClient(id);
        return toResponse(client);
    }

    @Transactional
    public ClientResponse create(ClientRequest request) {
        User currentUser = getCurrentUser();
        Client client = Client.builder()
                .fullName(request.getFullName())
                .phone(request.getPhone())
                .email(request.getEmail())
                .source(request.getSource())
                .status(request.getStatus())
                .comment(request.getComment())
                .assignedUser(currentUser)
                .build();

        return toResponse(clientRepository.save(client));
    }

    @Transactional
    public ClientResponse update(Long id, ClientRequest request) {
        Client client = getAccessibleClient(id);
        client.setFullName(request.getFullName());
        client.setPhone(request.getPhone());
        client.setEmail(request.getEmail());
        client.setSource(request.getSource());
        client.setStatus(request.getStatus());
        client.setComment(request.getComment());
        return toResponse(clientRepository.save(client));
    }

    public Client getAccessibleClient(Long id) {
        Client client = clientRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Клиент не найден"));
        User currentUser = getCurrentUser();

        if (currentUser.getRole() != UserRole.ADMIN
                && !client.getAssignedUser().getId().equals(currentUser.getId())) {
            throw new IllegalArgumentException("Нет доступа к клиенту");
        }

        return client;
    }

    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalStateException("Пользователь не найден"));
    }

    private ClientResponse toResponse(Client client) {
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
                .createdAt(client.getCreatedAt())
                .build();
    }
}
