package com.persiste.ui;

import com.persiste.model.Estudiante;
import com.persiste.service.EstudianteService;

import java.util.List;
import java.util.Scanner;

/**
 * Menú de consola. Solo pide datos y muestra resultados; toda la lógica está
 * en el servicio.
 */
public class EstudianteMenu {

    private final Scanner scanner;
    private final EstudianteService service;

    public EstudianteMenu(Scanner scanner, EstudianteService service) {
        this.scanner = scanner;
        this.service = service;
    }

    public void start() {
        while (true) {
            System.out.println();
            System.out.println("=== Estudiantes (Oracle) ===");
            System.out.println("1. Listar");
            System.out.println("2. Registrar");
            System.out.println("3. Buscar por correo");
            System.out.println("4. Eliminar");
            System.out.println("0. Salir");
            System.out.print("Opción: ");
            String opcion = scanner.nextLine().trim();
            try {
                switch (opcion) {
                    case "1" -> listar();
                    case "2" -> registrar();
                    case "3" -> buscar();
                    case "4" -> eliminar();
                    case "0" -> {
                        return;
                    }
                    default -> System.out.println("Opción no válida.");
                }
            } catch (IllegalArgumentException e) {
                System.out.println("Aviso: " + e.getMessage());
            } catch (RuntimeException e) {
                System.out.println("Error de base de datos: " + e.getMessage());
            }
        }
    }

    private void listar() {
        List<Estudiante> estudiantes = service.listar();
        if (estudiantes.isEmpty()) {
            System.out.println("No hay estudiantes.");
            return;
        }
        estudiantes.forEach(System.out::println);
    }

    private void registrar() {
        System.out.print("Nombre: ");
        String nombre = scanner.nextLine();
        System.out.print("Correo: ");
        String correo = scanner.nextLine();
        Estudiante nuevo = service.registrar(nombre, correo);
        System.out.println("Guardado con id " + nuevo.getId() + ".");
    }

    private void buscar() {
        System.out.print("Correo: ");
        System.out.println(service.buscarPorCorreo(scanner.nextLine().trim()));
    }

    private void eliminar() {
        System.out.print("Id: ");
        int id = Integer.parseInt(scanner.nextLine().trim());
        service.eliminar(id);
        System.out.println("Eliminado.");
    }
}
