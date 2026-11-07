package co.edu.unicesar.persisteapp.persistence;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.SQLException;

/** Transacción JDBC: una conexión, autocommit apagado, commit al final o rollback si algo falla. */
public class JdbcTransactionRunner implements TransactionRunner {

    private final DataSource dataSource;

    public JdbcTransactionRunner(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @Override
    public <T> T inTransaction(Work<T> work) {
        try (Connection connection = dataSource.getConnection()) {
            connection.setAutoCommit(false);              // desde aquí nada se guarda solo
            try {
                T result = work.run(new JdbcProductRepository(connection),
                                    new JdbcSaleRepository(connection));
                connection.commit();                      // todo salió bien: se guarda todo
                return result;
            } catch (RuntimeException e) {
                connection.rollback();                    // algo falló: no se guarda nada
                throw e;
            } finally {
                connection.setAutoCommit(true);           // la conexión vuelve limpia al pool
            }
        } catch (SQLException e) {
            throw new DataAccessException("Falló la transacción: " + e.getMessage(), e);
        }
    }
}
