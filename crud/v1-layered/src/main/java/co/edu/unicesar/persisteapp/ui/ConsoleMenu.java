package co.edu.unicesar.persisteapp.ui;

import co.edu.unicesar.persisteapp.model.Product;
import co.edu.unicesar.persisteapp.model.Sale;
import co.edu.unicesar.persisteapp.persistence.DataAccessException;
import co.edu.unicesar.persisteapp.service.InsufficientStockException;
import co.edu.unicesar.persisteapp.service.LoginService;
import co.edu.unicesar.persisteapp.service.ProductNotFoundException;
import co.edu.unicesar.persisteapp.service.ProductService;

import java.io.PrintStream;
import java.math.BigDecimal;
import java.util.Scanner;

/** Lee lo que escribe la persona y muestra resultados. No decide reglas ni toca SQL. */
public class ConsoleMenu {

    private final ProductService products;
    private final LoginService login;
    private final Scanner in;
    private final PrintStream out;

    public ConsoleMenu(ProductService products, LoginService login, Scanner in, PrintStream out) {
        this.products = products;
        this.login = login;
        this.in = in;
        this.out = out;
    }

    public void show() {
        while (true) {
            out.println();
            out.println("== Tienda v1 ==");
            out.println("1. Listar productos");
            out.println("2. Ver producto");
            out.println("3. Crear producto");
            out.println("4. Editar producto");
            out.println("5. Borrar producto");
            out.println("6. Registrar venta");
            out.println("7. Iniciar sesión");
            out.println("0. Salir");
            String option = ask(">");
            if (option.equals("0")) {
                return;
            }
            try {
                run(option);
            } catch (ProductNotFoundException | InsufficientStockException | IllegalArgumentException e) {
                out.println("No se pudo: " + e.getMessage());
            } catch (DataAccessException e) {
                out.println("Error de base de datos: " + e.getMessage());
            }
        }
    }

    private void run(String option) {
        switch (option) {
            case "1" -> products.list().forEach(this::print);
            case "2" -> print(products.find(askInt("Id")));
            case "3" -> print(products.create(ask("Nombre:"), askMoney("Precio"), askInt("Stock")));
            case "4" -> print(products.update(askInt("Id"), ask("Nombre:"), askMoney("Precio"), askInt("Stock")));
            case "5" -> {
                products.delete(askInt("Id"));
                out.println("Producto borrado");
            }
            case "6" -> {
                Sale sale = products.registerSale(askInt("Id del producto"), askInt("Cantidad"));
                out.println("Venta " + sale.id() + " registrada por $" + sale.total() + " (commit)");
            }
            case "7" -> out.println(login.login(ask("Usuario:"), ask("Clave:"))
                    ? "Bienvenido" : "Usuario o clave incorrectos");
            default -> out.println("Opción no válida");
        }
    }

    private void print(Product p) {
        out.println(p.id() + " | " + p.name() + " | $" + p.price() + " | stock " + p.stock());
    }

    private String ask(String label) {
        out.print(label + " ");
        return in.hasNextLine() ? in.nextLine().trim() : "0";
    }

    private int askInt(String label) {
        String text = ask(label + ":");
        try {
            return Integer.parseInt(text);
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("«" + text + "» no es un número entero");
        }
    }

    private BigDecimal askMoney(String label) {
        String text = ask(label + ":");
        try {
            return new BigDecimal(text.replace(",", "."));
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("«" + text + "» no es un precio válido");
        }
    }
}
