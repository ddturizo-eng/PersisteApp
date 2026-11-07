package co.edu.unicesar.persisteapp.persistence;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InOrder;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.SQLException;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class JdbcTransactionRunnerTest {

    @Mock DataSource dataSource;
    @Mock Connection connection;

    @Test
    void commitsWhenTheWorkSucceeds() throws SQLException {
        when(dataSource.getConnection()).thenReturn(connection);

        String result = new JdbcTransactionRunner(dataSource).inTransaction((products, sales) -> "ok");

        assertEquals("ok", result);
        InOrder order = inOrder(connection);
        order.verify(connection).setAutoCommit(false);
        order.verify(connection).commit();
        order.verify(connection).setAutoCommit(true);
        order.verify(connection).close();
        verify(connection, never()).rollback();
    }

    @Test
    void rollsBackAndRethrowsWhenTheWorkFails() throws SQLException {
        when(dataSource.getConnection()).thenReturn(connection);
        IllegalStateException boom = new IllegalStateException("sin stock");

        IllegalStateException thrown = assertThrows(IllegalStateException.class,
                () -> new JdbcTransactionRunner(dataSource).inTransaction((products, sales) -> {
                    throw boom;
                }));

        assertEquals(boom, thrown);
        InOrder order = inOrder(connection);
        order.verify(connection).setAutoCommit(false);
        order.verify(connection).rollback();
        order.verify(connection).setAutoCommit(true);
        order.verify(connection).close();
        verify(connection, never()).commit();
    }

    @Test
    void wrapsConnectionErrors() throws SQLException {
        when(dataSource.getConnection()).thenThrow(new SQLException("sin red"));
        assertThrows(DataAccessException.class,
                () -> new JdbcTransactionRunner(dataSource).inTransaction((products, sales) -> "nunca"));
    }
}
