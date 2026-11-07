package co.edu.unicesar.persisteapp.persistence;

import co.edu.unicesar.persisteapp.model.Sale;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;

/** SaleStore con JDBC. */
public class JdbcSaleRepository extends JdbcRepository implements SaleStore {

    public JdbcSaleRepository(DataSource dataSource) {
        super(dataSource);
    }

    JdbcSaleRepository(Connection connection) {
        super(connection);
    }

    @Override
    public Sale save(Sale sale) {
        String sql = "INSERT INTO sales (product_id, quantity, total) VALUES (?, ?, ?)";
        return withConnection("guardar la venta", connection -> {
            try (PreparedStatement ps = connection.prepareStatement(sql, new String[] {"id"})) {
                ps.setInt(1, sale.productId());
                ps.setInt(2, sale.quantity());
                ps.setBigDecimal(3, sale.total());
                ps.executeUpdate();
                try (ResultSet keys = ps.getGeneratedKeys()) {
                    keys.next();
                    return sale.withId(keys.getInt(1));
                }
            }
        });
    }
}
