package co.edu.unicesar.persisteapp.service;

public class ProductNotFoundException extends RuntimeException {

    public ProductNotFoundException(int id) {
        super("No existe un producto con id " + id);
    }
}
