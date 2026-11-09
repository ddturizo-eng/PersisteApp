package com.persiste.config;

/**
 * Lee los datos de conexión desde variables de entorno. La clave nunca se
 * escribe en el código: el sistema operativo se la entrega al programa al
 * arrancar. Si falta alguna variable, el programa se detiene con un mensaje
 * claro en lugar de fallar más tarde.
 */
public final class DatabaseConfig {

    private final String url;
    private final String user;
    private final String password;

    private DatabaseConfig(String url, String user, String password) {
        this.url = url;
        this.user = user;
        this.password = password;
    }

    /**
     * Construye la configuración a partir de DB_URL, DB_USER y DB_PASSWORD.
     *
     * @return la configuración lista para abrir conexiones
     * @throws IllegalStateException si falta alguna variable
     */
    public static DatabaseConfig fromEnvironment() {
        return new DatabaseConfig(
            required("DB_URL"),
            required("DB_USER"),
            required("DB_PASSWORD"));
    }

    private static String required(String name) {
        String value = System.getenv(name);
        if (value == null || value.isBlank()) {
            throw new IllegalStateException("Falta la variable de entorno " + name);
        }
        return value;
    }

    public String getUrl() {
        return url;
    }

    public String getUser() {
        return user;
    }

    public String getPassword() {
        return password;
    }

    /** Nunca muestra la clave, ni siquiera en logs. */
    @Override
    public String toString() {
        return "DatabaseConfig{url=" + url + ", user=" + user + ", password=****}";
    }
}
