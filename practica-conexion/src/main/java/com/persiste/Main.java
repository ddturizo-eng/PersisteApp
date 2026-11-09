package com.persiste;

import com.persiste.config.ConnectionFactory;
import com.persiste.config.DatabaseConfig;
import com.persiste.persistence.EstudianteRepository;
import com.persiste.service.EstudianteService;
import com.persiste.ui.EstudianteMenu;

import java.util.Scanner;

/**
 * Punto de entrada. Conecta las capas de abajo hacia arriba:
 * config, persistencia, servicio y menú.
 */
public class Main {

    public static void main(String[] args) {
        try {
            DatabaseConfig config = DatabaseConfig.fromEnvironment();
            ConnectionFactory connectionFactory = new ConnectionFactory(config);

            EstudianteRepository repository = new EstudianteRepository(connectionFactory);
            EstudianteService service = new EstudianteService(repository);

            Scanner scanner = new Scanner(System.in);
            new EstudianteMenu(scanner, service).start();
        } catch (IllegalStateException e) {
            System.err.println("Error de configuración: " + e.getMessage());
            System.exit(1);
        }
    }
}
