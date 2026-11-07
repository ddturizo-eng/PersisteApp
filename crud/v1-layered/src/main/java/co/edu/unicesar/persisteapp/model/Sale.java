package co.edu.unicesar.persisteapp.model;

import java.math.BigDecimal;

/** Una venta: cuántas unidades de un producto y cuánto se cobró. */
public record Sale(Integer id, int productId, int quantity, BigDecimal total) {

    public Sale withId(int newId) {
        return new Sale(newId, productId, quantity, total);
    }
}
