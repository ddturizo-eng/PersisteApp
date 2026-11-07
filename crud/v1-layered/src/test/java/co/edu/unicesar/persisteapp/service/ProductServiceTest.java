package co.edu.unicesar.persisteapp.service;

import co.edu.unicesar.persisteapp.model.Product;
import co.edu.unicesar.persisteapp.model.Sale;
import co.edu.unicesar.persisteapp.persistence.ProductStore;
import co.edu.unicesar.persisteapp.persistence.SaleStore;
import co.edu.unicesar.persisteapp.persistence.TransactionRunner;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProductServiceTest {

    @Mock ProductStore products;
    @Mock ProductStore txProducts;
    @Mock SaleStore txSales;
    @Mock TransactionRunner transactions;

    ProductService service;

    static final Product KEYBOARD = new Product(1, "Teclado", new BigDecimal("100.50"), 3);

    @BeforeEach
    void setUp() {
        service = new ProductService(products, transactions);
    }

    /** El runner falso ejecuta el trabajo con los stores de la transacción, como el real. */
    private void runTransactionsForReal() {
        when(transactions.inTransaction(any())).thenAnswer(inv -> {
            TransactionRunner.Work<?> work = inv.getArgument(0);
            return work.run(txProducts, txSales);
        });
    }

    @Test
    void listReturnsWhatTheStoreHas() {
        when(products.findAll()).thenReturn(List.of(KEYBOARD));
        assertEquals(List.of(KEYBOARD), service.list());
    }

    @Test
    void findThrowsWhenMissing() {
        when(products.findById(9)).thenReturn(Optional.empty());
        assertThrows(ProductNotFoundException.class, () -> service.find(9));
    }

    @Test
    void findReturnsTheProduct() {
        when(products.findById(1)).thenReturn(Optional.of(KEYBOARD));
        assertEquals(KEYBOARD, service.find(1));
    }

    @Test
    void createTrimsTheNameAndSaves() {
        when(products.save(any())).thenAnswer(inv -> inv.<Product>getArgument(0).withId(7));
        Product created = service.create("  Mouse  ", new BigDecimal("50"), 4);
        assertEquals(new Product(7, "Mouse", new BigDecimal("50"), 4), created);
    }

    @Test
    void createRejectsInvalidData() {
        assertThrows(IllegalArgumentException.class, () -> service.create(" ", BigDecimal.ONE, 1));
        assertThrows(IllegalArgumentException.class, () -> service.create(null, BigDecimal.ONE, 1));
        assertThrows(IllegalArgumentException.class, () -> service.create("x".repeat(81), BigDecimal.ONE, 1));
        assertThrows(IllegalArgumentException.class, () -> service.create("A", new BigDecimal("-1"), 1));
        assertThrows(IllegalArgumentException.class, () -> service.create("A", null, 1));
        assertThrows(IllegalArgumentException.class, () -> service.create("A", BigDecimal.ONE, -1));
        verifyNoInteractions(products);
    }

    @Test
    void updateSavesOrFailsWhenMissing() {
        when(products.update(any())).thenReturn(true);
        assertEquals(new Product(1, "Nuevo", BigDecimal.TEN, 2), service.update(1, "Nuevo", BigDecimal.TEN, 2));

        when(products.update(any())).thenReturn(false);
        assertThrows(ProductNotFoundException.class, () -> service.update(5, "X", BigDecimal.TEN, 2));
    }

    @Test
    void deleteFailsWhenMissing() {
        when(products.delete(1)).thenReturn(true);
        service.delete(1);
        verify(products).delete(1);

        when(products.delete(2)).thenReturn(false);
        assertThrows(ProductNotFoundException.class, () -> service.delete(2));
    }

    @Test
    void registerSaleSavesTheSaleAndDecreasesStockInOneTransaction() {
        runTransactionsForReal();
        when(txProducts.findById(1)).thenReturn(Optional.of(KEYBOARD));
        when(txSales.save(any())).thenAnswer(inv -> inv.<Sale>getArgument(0).withId(40));
        when(txProducts.decreaseStock(1, 2)).thenReturn(true);

        Sale sale = service.registerSale(1, 2);

        assertEquals(new Sale(40, 1, 2, new BigDecimal("201.00")), sale);
        verify(txProducts).decreaseStock(1, 2);
        verifyNoInteractions(products); // todo pasa por los stores de la transacción
    }

    @Test
    void registerSaleThrowsWhenStockIsShortSoTheRunnerRollsBack() {
        runTransactionsForReal();
        when(txProducts.findById(1)).thenReturn(Optional.of(KEYBOARD));
        when(txSales.save(any())).thenAnswer(inv -> inv.<Sale>getArgument(0).withId(41));
        when(txProducts.decreaseStock(1, 5)).thenReturn(false);

        InsufficientStockException e = assertThrows(InsufficientStockException.class,
                () -> service.registerSale(1, 5));
        assertEquals("Stock insuficiente de Teclado: hay 3 y pediste 5", e.getMessage());
    }

    @Test
    void registerSaleFailsWhenTheProductDoesNotExist() {
        runTransactionsForReal();
        when(txProducts.findById(9)).thenReturn(Optional.empty());

        assertThrows(ProductNotFoundException.class, () -> service.registerSale(9, 1));
        verify(txSales, never()).save(any());
    }

    @Test
    void registerSaleRejectsZeroOrNegativeQuantityWithoutOpeningATransaction() {
        assertThrows(IllegalArgumentException.class, () -> service.registerSale(1, 0));
        assertThrows(IllegalArgumentException.class, () -> service.registerSale(1, -3));
        verifyNoInteractions(transactions);
    }
}
