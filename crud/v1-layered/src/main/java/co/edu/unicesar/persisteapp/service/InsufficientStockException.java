package co.edu.unicesar.persisteapp.service;

public class InsufficientStockException extends RuntimeException {

    public InsufficientStockException(String product, int available, int requested) {
        super("Stock insuficiente de " + product + ": hay " + available + " y pediste " + requested);
    }
}
