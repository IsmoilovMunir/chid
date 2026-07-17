package com.chid.mortgage.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CreateRealtorRequest {

    @NotBlank(message = "Укажите ФИО")
    @Size(max = 255)
    private String fullName;

    @NotBlank(message = "Укажите телефон")
    @Size(max = 64)
    private String phone;

    @NotBlank(message = "Укажите email")
    @Email(message = "Некорректный email")
    private String email;

    @NotBlank(message = "Укажите пароль для входа")
    @Size(min = 6, message = "Пароль не короче 6 символов")
    private String password;

    /** Может работать с клиентами и сделками */
    private boolean realtor = true;

    /** Может быть брокером на сделке */
    private boolean broker = false;
}
