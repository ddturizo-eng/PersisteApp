package co.edu.unicesar.persisteapp.persistence;

import co.edu.unicesar.persisteapp.model.Product;

import java.util.List;
import java.util.Optional;

/**
 * Lo que la aplicación puede hacer con los productos guardados.
 * El servicio solo conoce esta interfaz: no sabe si detrás hay PostgreSQL, Oracle o un mock.
 */
public interface ProductStore {

    /** Inserta y devuelve el producto con el id que asignó la base. */
    Product save(Product product);

    /** @return false si no existe un producto con ese id. */
    boolean update(Product product);

    /** @return false si no existe un producto con ese id. */
    boolean delete(int id);

    Optional<Product> findById(int id);

    List<Product> findAll();

    /** Resta stock solo si alcanza. @return false si no había stock suficiente. */
    boolean decreaseStock(int id, int quantity);
}
