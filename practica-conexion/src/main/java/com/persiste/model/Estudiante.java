package com.persiste.model;

/**
 * Una fila de la tabla ESTUDIANTE convertida en objeto: cada columna es un atributo.
 */
public class Estudiante {

    private final Integer id;
    private final String nombre;
    private final String correo;

    /** Para un estudiante que aún no está en la base de datos (sin id). */
    public Estudiante(String nombre, String correo) {
        this(null, nombre, correo);
    }

    public Estudiante(Integer id, String nombre, String correo) {
        this.id = id;
        this.nombre = nombre;
        this.correo = correo;
    }

    public Integer getId() {
        return id;
    }

    public String getNombre() {
        return nombre;
    }

    public String getCorreo() {
        return correo;
    }

    @Override
    public String toString() {
        return id + " | " + nombre + " | " + correo;
    }
}
