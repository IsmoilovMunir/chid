package com.chid.mortgage.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdateRealtorRequest {

    @NotBlank(message = "Укажите ФИО")
    @Size(max = 255)
    private String fullName;

    @NotBlank(message = "Укажите телефон")
    @Size(max = 64)
    private String phone;

    @NotBlank(message = "Укажите email")
    @Email(message = "Некорректный email")
    private String email;

    /** Если пусто — пароль не меняется */
    @Size(min = 6, message = "Пароль не короче 6 символов")
    private String password;

    private boolean realtor = true;
    private boolean broker = false;
}
