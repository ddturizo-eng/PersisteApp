package co.edu.unicesar.persisteapp;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.Scanner;

/**
 * CRUD v0: TODO en una sola clase y MAL A PROPÓSITO (REQ-17).
 *
 * Sirve para la demo en clase. Sus defectos son el temario de los módulos 3 a 6:
 *  - Abre una conexión nueva en cada opción (módulo 3: el pool).
 *  - Pega lo que escribe la persona dentro del SQL (módulo 4: inyección).
 *  - Vende con dos sentencias sueltas, sin transacción (módulo 5: commit y rollback).
 *  - Mezcla menú, reglas y SQL en el mismo método (módulo 6: las capas).
 * La versión corregida está en ../v1-layered. No copiar este código.
 */
public class App {

    static String url = System.getenv("DB_URL");
    static String user = System.getenv("DB_USER");
    static String password = System.getenv("DB_PASSWORD");

    public static void main(String[] args) {
        if (url == null || user == null || password == null) {
            System.out.println("Faltan DB_URL, DB_USER o DB_PASSWORD. Mira el README.");
            return;
        }
        Scanner in = new Scanner(System.in);
        while (true) {
            System.out.println();
            System.out.println("== Tienda v0 ==");
            System.out.println("1. Listar productos");
            System.out.println("2. Buscar producto por nombre");
            System.out.println("3. Crear producto");
            System.out.println("4. Registrar venta");
            System.out.println("5. Iniciar sesión");
            System.out.println("0. Salir");
            System.out.print("> ");
            String option = in.nextLine().trim();
            try {
                if (option.equals("1")) {
                    // Conexión nueva cada vez: lenta y nunca se cierra
                    Connection c = DriverManager.getConnection(url, user, password);
                    Statement st = c.createStatement();
                    ResultSet rs = st.executeQuery("SELECT id, name, price, stock FROM products ORDER BY id");
                    while (rs.next()) {
                        System.out.println(rs.getInt("id") + " | " + rs.getString("name")
                                + " | $" + rs.getBigDecimal("price") + " | stock " + rs.getInt("stock"));
                    }
                } else if (option.equals("2")) {
                    System.out.print("Nombre: ");
                    String name = in.nextLine();
                    Connection c = DriverManager.getConnection(url, user, password);
                    Statement st = c.createStatement();
                    // Inyección SQL: prueba con   x' OR '1'='1
                    String sql = "SELECT id, name, price, stock FROM products WHERE name = '" + name + "'";
                    System.out.println("SQL enviado: " + sql);
                    ResultSet rs = st.executeQuery(sql);
                    int found = 0;
                    while (rs.next()) {
                        found++;
                        System.out.println(rs.getInt("id") + " | " + rs.getString("name")
                                + " | $" + rs.getBigDecimal("price") + " | stock " + rs.getInt("stock"));
                    }
                    System.out.println(found + " fila(s)");
                } else if (option.equals("3")) {
                    System.out.print("Nombre: ");
                    String name = in.nextLine();
                    System.out.print("Precio: ");
                    String price = in.nextLine();
                    System.out.print("Stock: ");
                    String stock = in.nextLine();
                    Connection c = DriverManager.getConnection(url, user, password);
                    Statement st = c.createStatement();
                    st.executeUpdate("INSERT INTO products (name, price, stock) VALUES ('"
                            + name + "', " + price + ", " + stock + ")");
                    System.out.println("Producto creado");
                } else if (option.equals("4")) {
                    System.out.print("Id del producto: ");
                    String id = in.nextLine();
                    System.out.print("Cantidad: ");
                    String quantity = in.nextLine();
                    Connection c = DriverManager.getConnection(url, user, password);
                    Statement st = c.createStatement();
                    // Sin transacción: cada sentencia se confirma sola (autocommit).
                    // Si la segunda falla, la venta queda guardada y el stock no baja.
                    st.executeUpdate("INSERT INTO sales (product_id, quantity, total) SELECT id, "
                            + quantity + ", price * " + quantity + " FROM products WHERE id = " + id);
                    System.out.println("Venta guardada");
                    int rows = st.executeUpdate("UPDATE products SET stock = stock - " + quantity
                            + " WHERE id = " + id + " AND stock >= " + quantity);
                    if (rows == 0) {
                        System.out.println("No había stock suficiente... pero la venta ya quedó guardada");
                    } else {
                        System.out.println("Stock descontado");
                    }
                } else if (option.equals("5")) {
                    System.out.print("Usuario: ");
                    String name = in.nextLine();
                    System.out.print("Clave: ");
                    String pass = in.nextLine();
                    Connection c = DriverManager.getConnection(url, user, password);
                    Statement st = c.createStatement();
                    // El mismo login del módulo 4. Prueba el usuario   ' OR '1'='1' --
                    String sql = "SELECT id FROM users WHERE name = '" + name
                            + "' AND password = '" + pass + "'";
                    System.out.println("SQL enviado: " + sql);
                    ResultSet rs = st.executeQuery(sql);
                    if (rs.next()) {
                        System.out.println("Bienvenido");
                    } else {
                        System.out.println("Usuario o clave incorrectos");
                    }
                } else if (option.equals("0")) {
                    break;
                } else {
                    System.out.println("Opción no válida");
                }
            } catch (SQLException e) {
                System.out.println("Error: " + e.getMessage());
            }
        }
    }
}
