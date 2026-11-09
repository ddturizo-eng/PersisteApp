/**
 * The class's sample database (specs/04-rumbo-teoria-bd.md §3): one source for the SQL lab,
 * the table cards and the table ↔ class mapper, so every visual shows the same data.
 */

export type Cell = string | number | null;
export type Row = Record<string, Cell>;

export type Column = {
  name: string;
  sqlType: string;
  /** Java type the column maps to without an ORM (REQ-45 CA2). */
  javaType: string;
  javaField: string;
  pk?: boolean;
  fk?: { table: TableName; column: string };
  notNull?: boolean;
  unique?: boolean;
  /** One line shown when the column is touched. */
  note: string;
};

export type TableName = "curso" | "estudiante" | "matricula";

export type TableDef = { name: TableName; javaClass: string; columns: Column[]; rows: Row[] };

export const tables: Record<TableName, TableDef> = {
  curso: {
    name: "curso",
    javaClass: "Curso",
    columns: [
      { name: "id", sqlType: "SERIAL", javaType: "int", javaField: "id", pk: true, note: "Llave primaria: el número que identifica cada curso. El motor lo pone solo." },
      { name: "nombre", sqlType: "VARCHAR(80)", javaType: "String", javaField: "nombre", notNull: true, note: "El nombre del curso: es texto." },
      { name: "creditos", sqlType: "INTEGER", javaType: "int", javaField: "creditos", notNull: true, note: "Los créditos del curso: es un número." },
    ],
    rows: [
      { id: 1, nombre: "Bases de Datos", creditos: 4 },
      { id: 2, nombre: "Programación II", creditos: 3 },
      { id: 3, nombre: "Redes", creditos: 3 },
    ],
  },
  estudiante: {
    name: "estudiante",
    javaClass: "Estudiante",
    columns: [
      { name: "id", sqlType: "SERIAL", javaType: "int", javaField: "id", pk: true, note: "Llave primaria: el número que identifica a cada estudiante. Nunca se repite." },
      { name: "nombre", sqlType: "VARCHAR(80)", javaType: "String", javaField: "nombre", notNull: true, note: "El nombre del estudiante: es texto." },
      { name: "correo", sqlType: "VARCHAR(120)", javaType: "String", javaField: "correo", unique: true, note: "El correo del estudiante: es texto." },
      { name: "nacimiento", sqlType: "DATE", javaType: "LocalDate", javaField: "nacimiento", note: "La fecha de nacimiento: es una fecha." },
    ],
    rows: [
      { id: 1, nombre: "Ana Torres", correo: "ana@unicesar.edu.co", nacimiento: "2004-03-12" },
      { id: 2, nombre: "Luis Pérez", correo: "luis@unicesar.edu.co", nacimiento: "2003-11-02" },
      { id: 3, nombre: "Sara Gómez", correo: "sara@unicesar.edu.co", nacimiento: "2005-07-25" },
      { id: 4, nombre: "Juan Díaz", correo: "juan@unicesar.edu.co", nacimiento: "2004-01-30" },
    ],
  },
  matricula: {
    name: "matricula",
    javaClass: "Matricula",
    columns: [
      { name: "id", sqlType: "SERIAL", javaType: "int", javaField: "id", pk: true, note: "Llave primaria: el número de la matrícula." },
      { name: "estudiante_id", sqlType: "INTEGER", javaType: "int", javaField: "estudianteId", fk: { table: "estudiante", column: "id" }, notNull: true, note: "Llave foránea: guarda el id del estudiante matriculado." },
      { name: "curso_id", sqlType: "INTEGER", javaType: "int", javaField: "cursoId", fk: { table: "curso", column: "id" }, notNull: true, note: "Llave foránea: guarda el id del curso." },
      { name: "nota", sqlType: "NUMERIC(2,1)", javaType: "double", javaField: "nota", note: "La nota, como 4.5." },
    ],
    rows: [
      { id: 1, estudiante_id: 1, curso_id: 1, nota: 4.5 },
      { id: 2, estudiante_id: 1, curso_id: 2, nota: 3.8 },
      { id: 3, estudiante_id: 2, curso_id: 1, nota: 4.0 },
      { id: 4, estudiante_id: 3, curso_id: 3, nota: 2.9 },
      { id: 5, estudiante_id: 4, curso_id: 2, nota: 4.2 },
    ],
  },
};

const literal = (value: Cell) => (value === null ? "NULL" : typeof value === "number" ? String(value) : `'${value.replace(/'/g, "''")}'`);

function columnSql(column: Column): string {
  const parts = [column.name, column.sqlType];
  if (column.pk) parts.push("PRIMARY KEY");
  if (column.notNull) parts.push("NOT NULL");
  if (column.unique) parts.push("UNIQUE");
  if (column.fk) parts.push(`REFERENCES ${column.fk.table}(${column.fk.column})`);
  return parts.join(" ");
}

/** CREATE TABLE statement of one table, as students see it. */
export function createTableSql(name: TableName): string {
  const t = tables[name];
  return `CREATE TABLE ${t.name} (\n${t.columns.map((c) => `  ${columnSql(c)}`).join(",\n")}\n);`;
}

/** Schema plus seed rows; SERIAL counters are moved past the seeded ids. */
export function seedSql(): string {
  const order: TableName[] = ["curso", "estudiante", "matricula"];
  const statements = order.flatMap((name) => {
    const t = tables[name];
    const cols = t.columns.map((c) => c.name);
    return [
      createTableSql(name),
      `INSERT INTO ${name} (${cols.join(", ")}) VALUES\n${t.rows.map((r) => `  (${cols.map((c) => literal(r[c] ?? null)).join(", ")})`).join(",\n")};`,
      `SELECT setval('${name}_id_seq', ${t.rows.length});`,
    ];
  });
  return statements.join("\n");
}

export type PresetQuery = {
  id: string;
  label: string;
  sql: string;
  /** What the student should notice. */
  explain: string;
  /** Table to show after running it. */
  shows: TableName;
};

export const presetQueries: PresetQuery[] = [
  { id: "select-all", label: "SELECT *", sql: "SELECT * FROM estudiante;", explain: "Trae todas las filas y todas las columnas.", shows: "estudiante" },
  { id: "select-where", label: "SELECT … WHERE", sql: "SELECT nombre, correo\nFROM estudiante\nWHERE id = 2;", explain: "WHERE filtra las filas; después de SELECT eliges las columnas.", shows: "estudiante" },
  { id: "select-order", label: "ORDER BY", sql: "SELECT nombre, creditos\nFROM curso\nORDER BY creditos DESC;", explain: "ORDER BY ordena el resultado; DESC es de mayor a menor.", shows: "curso" },
  { id: "insert", label: "INSERT", sql: "INSERT INTO estudiante (nombre, correo, nacimiento)\nVALUES ('Mario Ruiz', 'mario@unicesar.edu.co', '2004-09-15');", explain: "No escribimos el id: SERIAL lo genera el motor.", shows: "estudiante" },
  { id: "update", label: "UPDATE", sql: "UPDATE estudiante\nSET correo = 'ana.torres@unicesar.edu.co'\nWHERE id = 1;", explain: "SET cambia el valor; WHERE decide qué filas cambian.", shows: "estudiante" },
  { id: "update-no-where", label: "UPDATE sin WHERE", sql: "UPDATE curso\nSET creditos = 0;", explain: "Sin WHERE cambian TODAS las filas. Pulsa «Reiniciar datos» para deshacerlo.", shows: "curso" },
  { id: "delete", label: "DELETE", sql: "DELETE FROM matricula\nWHERE id = 5;", explain: "Borra la fila cuyo id es 5. Sin WHERE borraría todas.", shows: "matricula" },
  { id: "delete-fk", label: "DELETE con hijos", sql: "DELETE FROM estudiante\nWHERE id = 1;", explain: "Ana tiene matrículas que la señalan: el motor no deja borrarla y deja las filas como estaban.", shows: "estudiante" },
  { id: "insert-fk", label: "FK inválida", sql: "INSERT INTO matricula (estudiante_id, curso_id, nota)\nVALUES (99, 1, 4.0);", explain: "No existe el estudiante 99: la llave foránea lo impide.", shows: "matricula" },
  { id: "join", label: "JOIN", sql: "SELECT e.nombre AS estudiante, c.nombre AS curso, m.nota\nFROM matricula m\nJOIN estudiante e ON e.id = m.estudiante_id\nJOIN curso c ON c.id = m.curso_id\nORDER BY e.nombre;", explain: "JOIN une filas cuyas llaves coinciden: la FK de matricula con la PK de cada tabla.", shows: "matricula" },
  { id: "count", label: "COUNT + GROUP BY", sql: "SELECT c.nombre, COUNT(*) AS inscritos\nFROM matricula m\nJOIN curso c ON c.id = m.curso_id\nGROUP BY c.nombre;", explain: "GROUP BY junta las filas por curso y COUNT las cuenta.", shows: "matricula" },
  { id: "tx-rollback", label: "BEGIN … ROLLBACK", sql: "BEGIN;\nDELETE FROM matricula;\nSELECT COUNT(*) AS quedan FROM matricula;\nROLLBACK;", explain: "Dentro de la transacción quedan 0; ROLLBACK deshace todo y las 5 vuelven.", shows: "matricula" },
  { id: "tx-commit", label: "BEGIN … COMMIT", sql: "BEGIN;\nUPDATE matricula SET nota = nota + 0.2 WHERE curso_id = 1;\nUPDATE curso SET creditos = 5 WHERE id = 1;\nCOMMIT;", explain: "Los dos cambios se guardan juntos o ninguno: todo o nada.", shows: "matricula" },
];

export const presetById = Object.fromEntries(presetQueries.map((q) => [q.id, q])) as Record<string, PresetQuery>;
