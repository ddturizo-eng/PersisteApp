package co.edu.unicesar.persisteapp.service;

import co.edu.unicesar.persisteapp.model.Product;
import co.edu.unicesar.persisteapp.model.Sale;
import co.edu.unicesar.persisteapp.persistence.ProductStore;
import co.edu.unicesar.persisteapp.persistence.TransactionRunner;

import java.math.BigDecimal;
import java.util.List;

/** Reglas de la tienda. No sabe de SQL ni de consola: recibe sus dependencias por constructor. */
public class ProductService {

    private final ProductStore products;
    private final TransactionRunner transactions;

    public ProductService(ProductStore products, TransactionRunner transactions) {
        this.products = products;
        this.transactions = transactions;
    }

    public List<Product> list() {
        return products.findAll();
    }

    public Product find(int id) {
        return products.findById(id).orElseThrow(() -> new ProductNotFoundException(id));
    }

    public Product create(String name, BigDecimal price, int stock) {
        Product product = new Product(null, cleanName(name), checkPrice(price), checkStock(stock));
        return products.save(product);
    }

    public Product update(int id, String name, BigDecimal price, int stock) {
        Product product = new Product(id, cleanName(name), checkPrice(price), checkStock(stock));
        if (!products.update(product)) {
            throw new ProductNotFoundException(id);
        }
        return product;
    }

    public void delete(int id) {
        if (!products.delete(id)) {
            throw new ProductNotFoundException(id);
        }
    }

    /**
     * Vender = guardar la venta + descontar el stock. Las dos cosas o ninguna:
     * si no alcanza el stock, el rollback borra también la venta ya insertada.
     */
    public Sale registerSale(int productId, int quantity) {
        if (quantity <= 0) {
            throw new IllegalArgumentException("La cantidad debe ser mayor que cero");
        }
        return transactions.inTransaction((txProducts, txSales) -> {
            Product product = txProducts.findById(productId)
                    .orElseThrow(() -> new ProductNotFoundException(productId));
            BigDecimal total = product.price().multiply(BigDecimal.valueOf(quantity));
            Sale sale = txSales.save(new Sale(null, productId, quantity, total));
            if (!txProducts.decreaseStock(productId, quantity)) {
                throw new InsufficientStockException(product.name(), product.stock(), quantity);
            }
            return sale;
        });
    }

    private static String cleanName(String name) {
        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("El nombre no puede estar vacío");
        }
        String trimmed = name.trim();
        if (trimmed.length() > 80) {
            throw new IllegalArgumentException("El nombre admite hasta 80 caracteres");
        }
        return trimmed;
    }

    private static BigDecimal checkPrice(BigDecimal price) {
        if (price == null || price.signum() < 0) {
            throw new IllegalArgumentException("El precio no puede ser negativo");
        }
        return price;
    }

    private static int checkStock(int stock) {
        if (stock < 0) {
            throw new IllegalArgumentException("El stock no puede ser negativo");
        }
        return stock;
    }
}
