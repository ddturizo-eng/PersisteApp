import { ArrowRight } from "lucide-react";

/**
 * Module 8 (REQ-16 CA1: «el módulo 8 al menos la tabla de equivalencias Spring»): what the
 * student wrote by hand in CRUD v1 next to what Spring Boot does for them. A comparison, not an
 * output, so it carries no «Simulación» label (REQ-07 covers outputs).
 */
const rows: { topic: string; mine: string; spring: string; note: string }[] = [
  {
    topic: "Credenciales",
    mine: `config.setJdbcUrl(required("DB_URL"));
config.setUsername(required("DB_USER"));
config.setPassword(required("DB_PASSWORD"));`,
    spring: `# application.properties
spring.datasource.url=\${DB_URL}
spring.datasource.username=\${DB_USER}
spring.datasource.password=\${DB_PASSWORD}`,
    note: "La clave sigue fuera del código: Spring lee las mismas variables de entorno.",
  },
  {
    topic: "Pool de conexiones",
    mine: `HikariConfig config = new HikariConfig();
config.setMaximumPoolSize(5);
return new HikariDataSource(config);`,
    spring: `# viene con spring-boot-starter-jdbc
spring.datasource.hikari.maximum-pool-size=5`,
    note: "Al ver el driver y el starter, Spring Boot crea el DataSource con HikariCP.",
  },
  {
    topic: "Consultas",
    mine: `try (PreparedStatement ps = connection.prepareStatement(sql)) {
  ps.setInt(1, id);
  try (ResultSet rs = ps.executeQuery()) {
    return rs.next() ? Optional.of(map(rs)) : Optional.empty();
  }
}`,
    spring: `return jdbc.sql("SELECT id, name, price, stock FROM products WHERE id = ?")
    .param(id)
    .query(Product.class)
    .optional();`,
    note: "El SQL con ? es el mismo. JdbcClient pide la conexión al pool, la devuelve y cierra todo.",
  },
  {
    topic: "Transacciones",
    mine: `return transactions.inTransaction((txProducts, txSales) -> {
  // setAutoCommit(false), commit() y rollback()
});`,
    spring: `@Transactional
public Sale registerSale(int productId, int quantity) {
  // mismo cuerpo, sin inTransaction
}`,
    note: "Commit al terminar el método; rollback si sale una RuntimeException.",
  },
  {
    topic: "Errores",
    mine: `} catch (SQLException e) {
  throw new DataAccessException("No se pudo " + action + ": " + e.getMessage(), e);
}`,
    spring: `// Spring traduce SQLException a su propia
// org.springframework.dao.DataAccessException
// (DuplicateKeyException, DataIntegrityViolationException…)`,
    note: "Tu CRUD ya hacía lo mismo: excepción sin checked y con un nombre que dice qué pasó.",
  },
  {
    topic: "Armar las piezas",
    mine: `ProductService products = new ProductService(
    new JdbcProductRepository(dataSource),
    new JdbcTransactionRunner(dataSource));`,
    spring: `@Service
public class ProductService {
  public ProductService(ProductStore products, SaleStore sales) { … }
}`,
    note: "Con @Service y @Repository, Spring crea cada pieza y la pasa por constructor.",
  },
];

function Code({ label, code }: { label: string; code: string }) {
  return (
    <div className="min-w-0 space-y-1.5">
      <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{label}</p>
      <pre className="overflow-x-auto rounded-xl bg-code p-3 font-mono text-[0.8rem] leading-relaxed" tabIndex={0}>
        <code>{code}</code>
      </pre>
    </div>
  );
}

export function SpringMap() {
  return (
    <div className="space-y-4">
      <ol className="space-y-4">
        {rows.map((row, i) => (
          <li key={row.topic} className="space-y-3 rounded-3xl border-2 border-foreground/80 bg-card p-4 sm:p-5">
            <h3 className="flex items-baseline gap-2 text-lg font-semibold">
              <span className="text-sm text-muted-foreground tabular-nums">{i + 1}</span>
              {row.topic}
            </h3>
            <div className="grid gap-3 md:grid-cols-[1fr_auto_1fr] md:items-start">
              <Code label="Tú, en el CRUD v1" code={row.mine} />
              <ArrowRight aria-hidden="true" className="mx-auto hidden size-5 self-center text-primary md:block" />
              <Code label="Con Spring Boot" code={row.spring} />
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">{row.note}</p>
          </li>
        ))}
      </ol>
      <p className="rounded-2xl bg-sun/40 p-4 leading-relaxed">
        Lo que no cambia: el SQL, las tablas y las reglas del negocio, como el <code className="inline-code">stock &gt;= ?</code> que evita
        vender lo que no hay, siguen siendo tuyos.
      </p>
    </div>
  );
}
