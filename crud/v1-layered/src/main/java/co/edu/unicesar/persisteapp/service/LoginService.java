package co.edu.unicesar.persisteapp.service;

import co.edu.unicesar.persisteapp.persistence.UserRepository;

/** Decide si alguien puede entrar. La consulta segura vive en UserRepository. */
public class LoginService {

    private final UserRepository users;

    public LoginService(UserRepository users) {
        this.users = users;
    }

    public boolean login(String user, String password) {
        if (user == null || user.isBlank() || password == null || password.isEmpty()) {
            return false;
        }
        return users.login(user.trim(), password);
    }
}
