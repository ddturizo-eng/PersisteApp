package co.edu.unicesar.persisteapp.persistence;

/**
 * Ejecuta varias operaciones como una sola: o se guardan todas o ninguna.
 * El servicio la usa sin ver JDBC: recibe los stores ya atados a la misma transacción.
 */
public interface TransactionRunner {

    @FunctionalInterface
    interface Work<T> {
        T run(ProductStore products, SaleStore sales);
    }

    /** Confirma si {@code work} termina bien; si lanza una excepción, deshace todo y la relanza. */
    <T> T inTransaction(Work<T> work);
}
