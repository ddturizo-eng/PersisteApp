package co.edu.unicesar.persisteapp.persistence;

/** Envuelve una SQLException para que las capas de arriba no dependan de JDBC. */
public class DataAccessException extends RuntimeException {

    public DataAccessException(String message, Throwable cause) {
        super(message, cause);
    }
}
