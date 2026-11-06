/** Platform identity shared by layout, metadata, the landing and tests. */
export const site = {
  name: "PersisteApp",
  tagline: "Lo que registras, queda guardado",
  institution: "Universidad Popular del Cesar",
  program: "Ingeniería de Sistemas",
  course: "Programación de Computadores III",
  /** Teacher who runs the class sessions. */
  teacher: { title: "Ing. Esp.", name: "Alfredo David Bautista Romero" },
  /** Author of the platform. */
  author: { name: "Daniel David Turizo Chacón" },
} as const;
