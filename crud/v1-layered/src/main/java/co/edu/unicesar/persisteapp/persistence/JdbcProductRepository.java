package co.edu.unicesar.persisteapp.persistence;

import co.edu.unicesar.persisteapp.model.Product;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/** ProductStore con JDBC: PreparedStatement siempre y try-with-resources en cada recurso. */
public class JdbcProductRepository extends JdbcRepository implements ProductStore {

    private static final String COLUMNS = "id, name, price, stock";

    public JdbcProductRepository(DataSource dataSource) {
        super(dataSource);
    }

    JdbcProductRepository(Connection connection) {
        super(connection);
    }

    @Override
    public Product save(Product product) {
        String sql = "INSERT INTO products (name, price, stock) VALUES (?, ?, ?)";
        return withConnection("guardar el producto", connection -> {
            // Pedir la columna id funciona igual en PostgreSQL y en Oracle
            try (PreparedStatement ps = connection.prepareStatement(sql, new String[] {"id"})) {
                ps.setString(1, product.name());
                ps.setBigDecimal(2, product.price());
                ps.setInt(3, product.stock());
                ps.executeUpdate();
                try (ResultSet keys = ps.getGeneratedKeys()) {
                    keys.next();
                    return product.withId(keys.getInt(1));
                }
            }
        });
    }

    @Override
    public boolean update(Product product) {
        String sql = "UPDATE products SET name = ?, price = ?, stock = ? WHERE id = ?";
        return withConnection("actualizar el producto", connection -> {
            try (PreparedStatement ps = connection.prepareStatement(sql)) {
                ps.setString(1, product.name());
                ps.setBigDecimal(2, product.price());
                ps.setInt(3, product.stock());
                ps.setInt(4, product.id());
                return ps.executeUpdate() == 1;
            }
        });
    }

    @Override
    public boolean delete(int id) {
        String sql = "DELETE FROM products WHERE id = ?";
        return withConnection("borrar el producto", connection -> {
            try (PreparedStatement ps = connection.prepareStatement(sql)) {
                ps.setInt(1, id);
                return ps.executeUpdate() == 1;
            }
        });
    }

    @Override
    public Optional<Product> findById(int id) {
        String sql = "SELECT " + COLUMNS + " FROM products WHERE id = ?";
        return withConnection("buscar el producto", connection -> {
            try (PreparedStatement ps = connection.prepareStatement(sql)) {
                ps.setInt(1, id);
                try (ResultSet rs = ps.executeQuery()) {
                    return rs.next() ? Optional.of(map(rs)) : Optional.empty();
                }
            }
        });
    }

    @Override
    public List<Product> findAll() {
        String sql = "SELECT " + COLUMNS + " FROM products ORDER BY id";
        return withConnection("listar los productos", connection -> {
            try (PreparedStatement ps = connection.prepareStatement(sql);
                 ResultSet rs = ps.executeQuery()) {
                List<Product> products = new ArrayList<>();
                while (rs.next()) {
                    products.add(map(rs));
                }
                return products;
            }
        });
    }

    @Override
    public boolean decreaseStock(int id, int quantity) {
        // La condición stock >= ? evita vender lo que no hay, aunque dos cajas vendan a la vez
        String sql = "UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?";
        return withConnection("descontar el stock", connection -> {
            try (PreparedStatement ps = connection.prepareStatement(sql)) {
                ps.setInt(1, quantity);
                ps.setInt(2, id);
                ps.setInt(3, quantity);
                return ps.executeUpdate() == 1;
            }
        });
    }

    private static Product map(ResultSet rs) throws SQLException {
        return new Product(rs.getInt("id"), rs.getString("name"), rs.getBigDecimal("price"), rs.getInt("stock"));
    }
}
