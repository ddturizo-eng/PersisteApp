# PersisteApp · Imágenes de la landing y prompts de ilustración

> 6 nov 2026. Responde a REQ-33 (landing de conceptos) y al diseño §12.4. Estilo de referencia: Learnify (ilustración plana con contorno negro grueso), con la paleta de la Universidad Popular del Cesar.

## 1. Fotos y logos que ya están en `web/public`

| Archivo | Dónde va | Tratamiento | Nota |
|---|---|---|---|
| `estudiantes_en-campus.webp` | **Hero**, a la derecha del título | Tarjeta con esquinas de 24 px, recorte 4:3 centrado en los cuatro estudiantes y el letrero «YO ❤ UPC» | La foto más cálida y humana: es «tu clase, en tu universidad». |
| `campus-pasillo.jpg` | Sección final «Prepárate para el quiz» / botón «Empezar por el módulo 1» | Banda ancha con velo verde oscuro (`--foreground` al 70 %) para que el texto blanco pase AA | Camino y pérgolas verdes: sirve de metáfora de «recorrido». |
| `logos/unicesar.png` y `logos/unicesar-dark.png` | Cabecera de la landing y pie | PNG transparente (recortado del JPEG original). La variante `-dark` tiene el texto claro para el tema oscuro; el cubo conserva sus verdes | Si comunicaciones entrega el SVG oficial, reemplaza a estos. |
| `logos/ingesistemas.png` | Pie: «Programa de Ingeniería de Sistemas» | PNG transparente, 64 px de alto; el círculo y las letras blancas se conservan | Se ve bien en ambos temas. |
| `campus-modo-acreditacion.webp` | **No se usa** | — | Trae texto y brillo de campaña incrustados («Estamos modo acreditación»): compite con el título y no se puede traducir ni ajustar al tema oscuro. |

Los JPEG originales de los logos quedan como fuente; la app usa los PNG de `logos/`. Las fotos pesan 0.7–1.3 MB: se sirven con `next/image` (AVIF/WebP redimensionado), nunca en crudo. Confirmar que la foto de estudiantes es institucional y publicada por la UPC (personas reconocibles).

## 2. Estilo común para todas las ilustraciones

Pega este bloque **al inicio de cada prompt**. Está en inglés porque los modelos de imagen siguen mejor las instrucciones en ese idioma.

```text
STYLE: flat vector editorial illustration, Learnify-like. Bold uniform black outlines (3 px at 1024 px width), rounded line caps, no gradients, no textures, no shadows except one flat offset shadow under the main object. Simple people: oval heads, minimal faces (dot eyes, small curved smile), oversized expressive hands, rounded limbs, flat clothing. Warm Colombian Caribbean students, varied brown skin tones, dark curly or straight hair, casual university clothes.
PALETTE (use only these, flat fills): deep green #1E7B34, leaf green #6FB43F, lime #A6CE39, sun yellow #F2D21B, teal #1BA39C, black #111111, white #FFFFFF, warm paper #F7F6EF. Skin tones from #8D5A3B to #C68B5E.
COMPOSITION: one clear subject, generous empty space, isolated on a plain warm paper background #F7F6EF (or transparent if supported). 2–4 small accent marks allowed (yellow four-point sparkles, short motion lines), nothing else.
DO NOT: text, letters, numbers, logos, watermarks, UI screenshots, 3D, photorealism, gradients, glossy effects, medals, trophies, confetti.
```

**Formato de salida:** PNG, 2048 px de ancho, fondo transparente si el modelo lo permite (si no, fondo `#F7F6EF` liso para recortarlo después). Guardar en `web/public/ilustraciones/` con el nombre de la tabla.

## 3. Prompts por sección

### 3.1 Hero · `hero-conexion.png` (4:3)
Qué comunica: «tu código Java le pide datos a la base de datos».

```text
[STYLE block]
SCENE: A young woman student sits cross-legged on top of a giant database cylinder (three stacked rounded discs, leaf green #6FB43F with deep green #1E7B34 outlines of the disc edges). She holds an open laptop on her lap (white screen, no text) and smiles while looking at it. From the back of the laptop a thick black cable curves down and plugs into the side of the cylinder with a sun-yellow #F2D21B plug. Two small yellow sparkles near the plug. She wears a lime #A6CE39 t-shirt, black trousers and white sneakers; curly dark hair in a bun.
Aspect ratio 4:3, subject centered slightly to the right, empty space on the left.
```

### 3.2 Las cuatro piezas · `piezas-driver.png` (1:1)
Qué comunica: el driver JDBC es el adaptador entre tu app y el motor.

```text
[STYLE block]
SCENE: A young man student, seen from the side, holds a big travel power adapter (teal #1BA39C, rounded box with two different plug shapes) and is plugging it between a laptop on the left (white screen, no text) and a tall server tower on the right (deep green #1E7B34 with three lime #A6CE39 indicator dots). His tongue slightly out in concentration, oversized hands. Short motion lines around the adapter showing it clicking into place. He wears a white t-shirt and a yellow #F2D21B backpack.
Aspect ratio 1:1.
```

### 3.3 Conexión y pool · `pool-bicicletas.png` (16:9)
Qué comunica: el pool **presta y recibe de vuelta** conexiones, como las bicicletas compartidas del campus.

```text
[STYLE block]
SCENE: A shared-bike docking station with four identical simple bicycles (frames in leaf green #6FB43F, black wheels) parked in a row under a flat deep green #1E7B34 canopy. On the left, a student girl is taking one bike out of its dock, smiling. On the right, a student boy is pushing another bike back into a dock, giving a small thumbs-up. One dock is empty between them. Small yellow #F2D21B arrows above them: one pointing out of the station (left), one pointing into it (right). Both wear casual clothes in lime and white.
Aspect ratio 16:9, wide and balanced.
```

### 3.4 Consulta segura · `consulta-segura.png` (1:1)
Qué comunica: con `PreparedStatement` el dato viaja **sellado y aparte** de la orden.

```text
[STYLE block]
SCENE: A service window (counter with a small roof, deep green #1E7B34). A student hands two separate items through the window: in one hand a clean white card (the instruction, blank, no text), in the other a closed envelope sealed with a yellow #F2D21B wax seal (the data). Behind the counter, a friendly clerk wearing a teal #1BA39C cap receives the card with one hand and keeps the sealed envelope apart in a small tray. Calm, orderly mood. Two small sparkles near the seal.
Aspect ratio 1:1.
```

### 3.5 Recorrido de la clase · `recorrido-modulos.png` (16:9)
Qué comunica: siete módulos cortos, uno tras otro, hasta el quiz.

```text
[STYLE block]
SCENE: A winding path seen from slightly above, made of seven rounded stepping stones that alternate leaf green #6FB43F and lime #A6CE39, leading from the bottom left to the top right. A student walks on the third stone holding a phone, looking forward. At the end of the path, a big sun-yellow #F2D21B flag on a black pole (blank flag, no text or symbols). Small tufts of grass and one palm leaf at the edges.
Aspect ratio 16:9.
```

### 3.6 Prepárate para el quiz · `quiz-final.png` (4:3)
Qué comunica: el quiz final es un reto tranquilo, de una pregunta a la vez (sin trofeos ni medallas, P8).

```text
[STYLE block]
SCENE: A student boy rides a giant pencil like a surfboard (pencil body teal #1BA39C, tip black, eraser lime #A6CE39), arms open for balance, confident smile. Below him, three floating answer bubbles in a row (white rounded rectangles with black outlines, empty, no text); the middle one has a bold yellow #F2D21B check mark. A small stopwatch icon floats near his shoulder (white face, black outline, no numbers). Two yellow sparkles.
Aspect ratio 4:3, subject centered.
```

### 3.7 Opcional · estados vacíos `espera-docente.png` (1:1)
Para «Esperando a que el docente abra el quiz».

```text
[STYLE block]
SCENE: A student sits on a bench with a laptop closed on her knees, calmly sipping from a white mug, looking to the side as if waiting for someone. A small analog wall clock above her (white face, black outline, no numbers). Relaxed mood. Lime #A6CE39 sweater, black trousers.
Aspect ratio 1:1, small and simple.
```

## 4. Lo que **no** se genera con IA

- **Diagramas didácticos** (las 4 piezas con la consulta que viaja, conexión, pool en acción, SQL concatenado vs `PreparedStatement`): son SVG propios en código, porque deben ser exactos, accesibles con teclado, animables y legibles en ambos temas.
- **Logos de la UPC:** solo los oficiales; un modelo de imagen deforma marcas.
- **Fotos de personas:** solo las reales de la universidad.

## 5. Revisión antes de subirlas

1. Sin texto, letras ni números en la imagen (los modelos suelen colarlos: regenerar si aparecen).
2. Contorno negro uniforme y solo colores de la paleta.
3. Manos con 5 dedos y sin deformaciones.
4. Fondo transparente o `#F7F6EF` liso.
5. Peso: exportar a WebP calidad 85 antes de commitear (objetivo < 250 KB por imagen).

### 3.x Módulo 2 · `credenciales-entorno.png` (4:3)
Qué comunica: la clave **no va escrita en el código**; la app la recibe del entorno al arrancar. Generada el 6 nov 2026; se usa en el paso «La clave no va en el código» del módulo 2.

```text
[STYLE block]
SCENE: A young woman student sits at a desk with an open laptop (white screen, no text). Behind her, mounted on the wall, a small deep green #1E7B34 key cabinet with its little door open; a sun-yellow #F2D21B key floats out of the cabinet toward the laptop along a dotted curved line. On the desk, a crumpled paper ball in the trash bin next to her (the password she did not write in the code). She smiles, oversized hands resting on the keyboard. She wears a teal #1BA39C hoodie; straight dark hair in a ponytail. Two small yellow sparkles near the key.
Aspect ratio 4:3, subject slightly to the left, empty space on the right.
```


### 3.x Módulo 5 · `todo-o-nada.png` (4:3)
Qué comunica: vender son **dos cosas que van juntas** (guardar la venta y sacar el producto del estante); si una falla, se deshacen las dos. Generada el 7 nov 2026; fondo retirado y exportada a WebP (1079×943, 69 KB). Se usa en el paso «Una transacción: todo o nada» del módulo 5.

```text
[STYLE block]
SCENE: A young man student behind a small shop counter holds a sun-yellow #F2D21B receipt in one oversized hand and, with the other, places a small box back on a deep green #1E7B34 shelf. Between the receipt and the box, a dotted curved line ties them together with a small padlock icon in the middle (they go together). On the counter, a big round button with a curved "undo" arrow (no text). He wears a teal #1BA39C t-shirt; short curly hair; calm smile. Two small yellow sparkles near the padlock.
Aspect ratio 4:3, subject slightly to the left, empty space on the right.
```
