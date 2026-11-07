package co.edu.unicesar.persisteapp.persistence;

import co.edu.unicesar.persisteapp.model.Sale;

/** Ventas guardadas. */
public interface SaleStore {

    /** Inserta y devuelve la venta con el id que asignó la base. */
    Sale save(Sale sale);
}
