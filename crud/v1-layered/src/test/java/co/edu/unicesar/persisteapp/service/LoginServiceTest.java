package co.edu.unicesar.persisteapp.service;

import co.edu.unicesar.persisteapp.persistence.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class LoginServiceTest {

    @Mock UserRepository users;

    @Test
    void asksTheRepositoryWithTheTrimmedUser() {
        when(users.login("ana", "clave123")).thenReturn(true);
        assertTrue(new LoginService(users).login("  ana ", "clave123"));
    }

    @Test
    void emptyInputNeverReachesTheDatabase() {
        LoginService login = new LoginService(users);
        assertFalse(login.login(" ", "x"));
        assertFalse(login.login(null, "x"));
        assertFalse(login.login("ana", ""));
        assertFalse(login.login("ana", null));
        verifyNoInteractions(users);
    }
}
