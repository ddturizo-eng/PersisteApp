/**
 * Illustrations available to lessons (docs/ilustraciones.md). Lessons reference them by name, so the
 * build rejects unknown names and next/image always gets the real size.
 */
export const illustrations = {
  "hero-conexion": { width: 878, height: 974, alt: "Una estudiante trabaja en su portátil sentada sobre una base de datos, conectada por un cable." },
  "piezas-driver": { width: 1222, height: 844, alt: "Un estudiante conecta un adaptador entre su portátil y un servidor: el driver hace de adaptador." },
  "pool-bicicletas": { width: 1372, height: 591, alt: "Una estudiante toma una bicicleta compartida y otro estudiante devuelve la suya en la estación." },
  "consulta-segura": { width: 1267, height: 1245, alt: "En una ventanilla, una estudiante entrega una tarjeta y, aparte, un sobre sellado." },
  "recorrido-modulos": { width: 1317, height: 733, alt: "Una estudiante avanza por un camino de siete piedras hacia una bandera." },
  "quiz-final": { width: 793, height: 912, alt: "Un estudiante surfea sobre un lápiz gigante encima de tres respuestas, una marcada como correcta." },
  "credenciales-entorno": { width: 1107, height: 986, alt: "Una estudiante trabaja en su portátil mientras una llave sale de un armario en la pared y vuela hacia el equipo; en la papelera hay un papel arrugado." },
  "todo-o-nada": { width: 1079, height: 943, alt: "Un estudiante en un mostrador sostiene un recibo y devuelve una caja al estante; un candado une el recibo y la caja, y sobre el mostrador hay un botón de deshacer." },
  "espera-docente": { width: 1261, height: 1229, alt: "Una persona espera sentada en una banca con una taza, mirando el reloj." },
} as const;

export type IllustrationName = keyof typeof illustrations;

export const illustrationNames = Object.keys(illustrations) as [IllustrationName, ...IllustrationName[]];

export const illustrationSrc = (name: IllustrationName) => `/ilustraciones/${name}.webp`;
