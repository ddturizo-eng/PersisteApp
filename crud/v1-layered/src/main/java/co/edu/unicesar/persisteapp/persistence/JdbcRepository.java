package co.edu.unicesar.persisteapp.persistence;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.SQLException;

/**
 * Base de los repositorios JDBC. Trabaja de dos formas:
 *  - con un DataSource (el pool): cada operación pide una conexión y la devuelve al terminar;
 *  - con una Connection fija: la usa {@link JdbcTransactionRunner} para que varias operaciones
 *    compartan la misma transacción. Esa conexión la cierra quien la abrió, no el repositorio.
 */
abstract class JdbcRepository {

    @FunctionalInterface
    interface SqlWork<T> {
        T run(Connection connection) throws SQLException;
    }

    private final DataSource dataSource;
    private final Connection connection;

    JdbcRepository(DataSource dataSource) {
        this.dataSource = dataSource;
        this.connection = null;
    }

    JdbcRepository(Connection connection) {
        this.dataSource = null;
        this.connection = connection;
    }

    <T> T withConnection(String action, SqlWork<T> work) {
        try {
            if (connection != null) {
                return work.run(connection);
            }
            try (Connection pooled = dataSource.getConnection()) {
                return work.run(pooled);
            }
        } catch (SQLException e) {
            throw new DataAccessException("No se pudo " + action + ": " + e.getMessage(), e);
        }
    }
}
