package com.persiste.persistence;

import com.persiste.model.Estudiante;

import java.util.List;
import java.util.Optional;

/**
 * Lo que el servicio necesita del almacenamiento de estudiantes. El servicio
 * depende de esta interfaz, no de Oracle, así que se puede cambiar el motor
 * sin tocar la lógica.
 */
public interface EstudianteStore {

    List<Estudiante> findAll();

    Optional<Estudiante> findByCorreo(String correo);

    /**
     * Guarda un estudiante nuevo.
     *
     * @return el estudiante con el id que le asignó Oracle
     */
    Estudiante save(Estudiante estudiante);

    /**
     * Borra un estudiante por su id.
     *
     * @return true si existía y se borró
     */
    boolean deleteById(int id);
}
