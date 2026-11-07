package co.edu.unicesar.persisteapp.model;

import java.math.BigDecimal;

/** Un producto de la tienda. {@code id} es null hasta que la base lo asigna. */
public record Product(Integer id, String name, BigDecimal price, int stock) {

    public Product withId(int newId) {
        return new Product(newId, name, price, stock);
    }
}
