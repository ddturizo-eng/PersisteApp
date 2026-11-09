import { ArrowRight, Columns3, Database, FileCode2, KeyRound, Link2, ListOrdered, MessageSquare, Rows3, Server, Undo2 } from "lucide-react";

type Concept = { term: string; icon: typeof Database; def: string; example: React.ReactNode };

const mono = "rounded-lg bg-muted px-2 py-1 font-mono text-xs";

/** Definitions first (author, 8 Nov 2026): what each word means, in one line, with a tiny example. */
const groups: { title: string; concepts: Concept[] }[] = [
  {
    title: "Dónde se guardan los datos",
    concepts: [
      { term: "Base de datos", icon: Database, def: "Conjunto de datos guardados en disco, ordenados y que no se borran al cerrar el programa.", example: <span className={mono}>universidad</span> },
      { term: "Motor", icon: Server, def: "El programa que guarda la base de datos y responde lo que le pides. Ejemplos: PostgreSQL y Oracle.", example: <span className={mono}>PostgreSQL · Oracle</span> },
      { term: "Tabla", icon: ListOrdered, def: "Donde se guarda UNA cosa, como estudiantes o cursos, en filas y columnas. Parecida a una hoja de Excel.", example: <span className={mono}>estudiante</span> },
      { term: "Fila", icon: Rows3, def: "Un registro completo: un estudiante con todos sus datos.", example: <span className={mono}>1 · Ana Torres · ana@…</span> },
      { term: "Columna", icon: Columns3, def: "Un dato que tienen todas las filas, como el nombre o el correo.", example: <span className={mono}>nombre</span> },
    ],
  },
  {
    title: "Cómo se identifican y se relacionan",
    concepts: [
      { term: "Llave primaria (PK)", icon: KeyRound, def: "La columna que identifica cada fila sin repetirse. Casi siempre un número llamado id.", example: <span className={mono}>id = 1</span> },
      { term: "Llave foránea (FK)", icon: Link2, def: "Columna que guarda el id de una fila de OTRA tabla. Así se unen las tablas.", example: (
          <span className="inline-flex items-center gap-1">
            <span className={mono}>estudiante_id = 1</span>
            <ArrowRight aria-hidden="true" className="size-3.5" />
            <span className={mono}>Ana</span>
          </span>
        ) },
    ],
  },
  {
    title: "Cómo se le habla al motor",
    concepts: [
      { term: "SQL", icon: FileCode2, def: "El idioma para pedirle cosas al motor. PostgreSQL y Oracle lo hablan casi igual.", example: <span className={mono}>SELECT · INSERT · UPDATE · DELETE</span> },
      { term: "Consulta", icon: MessageSquare, def: "Una orden escrita en SQL. El motor la ejecuta y responde con filas o con un «listo».", example: <span className={mono}>SELECT * FROM estudiante;</span> },
      { term: "Transacción", icon: Undo2, def: "Varios cambios que se guardan juntos (COMMIT) o se deshacen juntos (ROLLBACK).", example: <span className={mono}>BEGIN … COMMIT</span> },
    ],
  },
];

const offsets = groups.map((_, i) => groups.slice(0, i).reduce((sum, g) => sum + g.concepts.length, 0));

export function ConceptCards() {
  return (
    <div className="space-y-8">
      {groups.map((group, gi) => (
        <div key={group.title} className="space-y-3">
          <h3 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">{group.title}</h3>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {group.concepts.map((c, ci) => {
              const n = offsets[gi] + ci + 1;
              const Icon = c.icon;
              return (
                <li key={c.term} className="flex flex-col gap-3 rounded-3xl border-2 border-foreground bg-card p-5">
                  <div className="flex items-center gap-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-2xl border-2 border-foreground bg-sun text-sun-foreground">
                      <Icon aria-hidden="true" className="size-5" />
                    </span>
                    <span className="text-lg leading-tight font-semibold">{c.term}</span>
                    <span className="ml-auto font-mono text-xs text-muted-foreground tabular-nums">{String(n).padStart(2, "0")}</span>
                  </div>
                  <p className="leading-relaxed">{c.def}</p>
                  <div className="mt-auto">{c.example}</div>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}
