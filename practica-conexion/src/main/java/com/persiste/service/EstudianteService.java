package com.persiste.service;

import com.persiste.model.Estudiante;
import com.persiste.persistence.EstudianteStore;

import java.util.List;
import java.util.regex.Pattern;

/**
 * Reglas del negocio sobre estudiantes. Valida los datos antes de llegar a la
 * base de datos y no sabe nada de SQL ni de Oracle.
 */
public class EstudianteService {

    private static final Pattern CORREO =
        Pattern.compile("^[\\w.+-]+@[\\w-]+(\\.[\\w-]+)+$");

    private final EstudianteStore store;

    public EstudianteService(EstudianteStore store) {
        this.store = store;
    }

    public List<Estudiante> listar() {
        return store.findAll();
    }

    public Estudiante registrar(String nombre, String correo) {
        if (nombre == null || nombre.isBlank()) {
            throw new IllegalArgumentException("El nombre es obligatorio.");
        }
        if (correo == null || !CORREO.matcher(correo.trim()).matches()) {
            throw new IllegalArgumentException("El correo no es válido.");
        }
        if (store.findByCorreo(correo.trim()).isPresent()) {
            throw new IllegalArgumentException("Ya existe un estudiante con ese correo.");
        }
        return store.save(new Estudiante(nombre.trim(), correo.trim()));
    }

    public Estudiante buscarPorCorreo(String correo) {
        return store.findByCorreo(correo)
            .orElseThrow(() -> new IllegalArgumentException("No existe un estudiante con ese correo."));
    }

    public void eliminar(int id) {
        if (!store.deleteById(id)) {
            throw new IllegalArgumentException("No existe un estudiante con id " + id + ".");
        }
    }
}
