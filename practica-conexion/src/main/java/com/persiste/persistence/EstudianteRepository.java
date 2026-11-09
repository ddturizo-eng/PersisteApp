package com.persiste.persistence;

import com.persiste.config.ConnectionFactory;
import com.persiste.model.Estudiante;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/**
 * Implementación JDBC sobre Oracle, sin ORM. Reglas que sigue en cada método:
 * <ul>
 *   <li>Siempre {@link PreparedStatement} con {@code ?}: el dato del usuario
 *       viaja aparte del SQL y no puede inyectar código.</li>
 *   <li>Siempre try-with-resources: la conexión se cierra aunque haya error.</li>
 *   <li>executeQuery para leer, executeUpdate para cambiar.</li>
 * </ul>
 */
public class EstudianteRepository implements EstudianteStore {

    private static final String SELECT_ALL =
        "SELECT id, nombre, correo FROM estudiante ORDER BY id";
    private static final String SELECT_BY_CORREO =
        "SELECT id, nombre, correo FROM estudiante WHERE correo = ?";
    private static final String INSERT =
        "INSERT INTO estudiante (nombre, correo) VALUES (?, ?)";
    private static final String DELETE_BY_ID =
        "DELETE FROM estudiante WHERE id = ?";

    private final ConnectionFactory connectionFactory;

    public EstudianteRepository(ConnectionFactory connectionFactory) {
        this.connectionFactory = connectionFactory;
    }

    @Override
    public List<Estudiante> findAll() {
        List<Estudiante> estudiantes = new ArrayList<>();
        try (Connection con = connectionFactory.getConnection();
             PreparedStatement ps = con.prepareStatement(SELECT_ALL);
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                estudiantes.add(toEstudiante(rs));
            }
            return estudiantes;
        } catch (SQLException e) {
            throw new RuntimeException("No se pudieron leer los estudiantes", e);
        }
    }

    @Override
    public Optional<Estudiante> findByCorreo(String correo) {
        try (Connection con = connectionFactory.getConnection();
             PreparedStatement ps = con.prepareStatement(SELECT_BY_CORREO)) {
            ps.setString(1, correo);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next() ? Optional.of(toEstudiante(rs)) : Optional.empty();
            }
        } catch (SQLException e) {
            throw new RuntimeException("No se pudo buscar el estudiante", e);
        }
    }

    @Override
    public Estudiante save(Estudiante estudiante) {
        // Pide a Oracle que devuelva el id generado por la columna IDENTITY.
        try (Connection con = connectionFactory.getConnection();
             PreparedStatement ps = con.prepareStatement(INSERT, new String[] {"ID"})) {
            ps.setString(1, estudiante.getNombre());
            ps.setString(2, estudiante.getCorreo());
            ps.executeUpdate();
            try (ResultSet keys = ps.getGeneratedKeys()) {
                keys.next();
                return new Estudiante(keys.getInt(1), estudiante.getNombre(), estudiante.getCorreo());
            }
        } catch (SQLException e) {
            throw new RuntimeException("No se pudo guardar el estudiante", e);
        }
    }

    @Override
    public boolean deleteById(int id) {
        try (Connection con = connectionFactory.getConnection();
             PreparedStatement ps = con.prepareStatement(DELETE_BY_ID)) {
            ps.setInt(1, id);
            return ps.executeUpdate() > 0;
        } catch (SQLException e) {
            throw new RuntimeException("No se pudo borrar el estudiante", e);
        }
    }

    /** De la fila al objeto: copia cada columna a su atributo. */
    private Estudiante toEstudiante(ResultSet rs) throws SQLException {
        return new Estudiante(
            rs.getInt("id"),
            rs.getString("nombre"),
            rs.getString("correo"));
    }
}
