package com.persiste.config;

import oracle.jdbc.pool.OracleDataSource;

import java.sql.Connection;
import java.sql.SQLException;

/**
 * Único lugar que sabe cómo abrir una conexión a Oracle. Los repositorios le
 * piden conexiones y no conocen la URL ni la clave.
 */
public class ConnectionFactory {

    private final OracleDataSource dataSource;

    public ConnectionFactory(DatabaseConfig config) {
        try {
            dataSource = new OracleDataSource();
            dataSource.setURL(config.getUrl());
            dataSource.setUser(config.getUser());
            dataSource.setPassword(config.getPassword());
        } catch (SQLException e) {
            throw new IllegalStateException("No se pudo configurar el driver de Oracle", e);
        }
    }

    /**
     * Abre una conexión nueva. Quien la pide debe cerrarla con try-with-resources.
     *
     * @return una conexión abierta
     * @throws SQLException si Oracle no responde o las credenciales son incorrectas
     */
    public Connection getConnection() throws SQLException {
        return dataSource.getConnection();
    }
}
