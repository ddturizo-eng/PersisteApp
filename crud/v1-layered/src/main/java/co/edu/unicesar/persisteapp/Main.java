package co.edu.unicesar.persisteapp;

import co.edu.unicesar.persisteapp.persistence.ConnectionPool;
import co.edu.unicesar.persisteapp.persistence.JdbcProductRepository;
import co.edu.unicesar.persisteapp.persistence.JdbcTransactionRunner;
import co.edu.unicesar.persisteapp.persistence.UserRepository;
import co.edu.unicesar.persisteapp.service.LoginService;
import co.edu.unicesar.persisteapp.service.ProductService;
import co.edu.unicesar.persisteapp.ui.ConsoleMenu;
import com.zaxxer.hikari.HikariDataSource;

import java.util.Scanner;

/** Arma la aplicación: crea cada pieza y se la pasa a la siguiente por constructor. */
public class Main {

    public static void main(String[] args) {
        // try-with-resources: al salir se cierra el pool y sus conexiones
        try (HikariDataSource dataSource = ConnectionPool.create()) {
            ProductService products = new ProductService(
                    new JdbcProductRepository(dataSource),
                    new JdbcTransactionRunner(dataSource));
            LoginService login = new LoginService(new UserRepository(dataSource));
            new ConsoleMenu(products, login, new Scanner(System.in), System.out).show();
        } catch (IllegalStateException e) {
            System.out.println(e.getMessage());
        }
    }
}
