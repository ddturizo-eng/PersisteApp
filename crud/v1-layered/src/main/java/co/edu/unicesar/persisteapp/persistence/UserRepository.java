package co.edu.unicesar.persisteapp.persistence;

import javax.sql.DataSource;
import java.sql.PreparedStatement;
import java.sql.ResultSet;

/** El login del módulo 4, versión segura: los datos viajan aparte del SQL. */
public class UserRepository extends JdbcRepository {

    public UserRepository(DataSource dataSource) {
        super(dataSource);
    }

    public boolean login(String user, String password) {
        String sql = "SELECT id FROM users WHERE name = ? AND password = ?";
        return withConnection("validar el usuario", connection -> {
            try (PreparedStatement ps = connection.prepareStatement(sql)) {
                ps.setString(1, user);
                ps.setString(2, password);
                try (ResultSet rs = ps.executeQuery()) {
                    return rs.next();
                }
            }
        });
    }
}
