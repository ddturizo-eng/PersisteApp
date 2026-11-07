package co.edu.unicesar.persisteapp.persistence;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;

/** Crea el pool HikariCP con las credenciales del entorno: nunca quedan escritas en el código. */
public final class ConnectionPool {

    private ConnectionPool() {
    }

    public static HikariDataSource create() {
        HikariConfig config = new HikariConfig();
        config.setJdbcUrl(required("DB_URL"));
        config.setUsername(required("DB_USER"));
        config.setPassword(required("DB_PASSWORD"));
        // Pocas conexiones: el plan gratuito de Supabase admite pocas a la vez
        config.setMaximumPoolSize(5);
        config.setMinimumIdle(1);
        config.setConnectionTimeout(10_000);
        config.setPoolName("persisteapp");
        return new HikariDataSource(config);
    }

    private static String required(String name) {
        String value = System.getenv(name);
        if (value == null || value.isBlank()) {
            throw new IllegalStateException("Falta la variable de entorno " + name + ". Mira el README.");
        }
        return value;
    }
}
