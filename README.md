# Naruto Card Battle — 1 vs 1 Arena

Juego web de estrategia y combate de cartas coleccionables por turnos ambientado en el universo de **Naruto**. Desarrollado con **JavaScript Vanilla (ES6+)** y arquitectura modular basada en **Web Components nativos**, con persistencia en la nube mediante **MockAPI** y consumo exclusivo a través de **Fetch API**.

**Despliegue en vivo:** [https://judaveot05-art.github.io/CARD-GAME-Proyecto-/](https://judaveot05-art.github.io/CARD-GAME-Proyecto-/)

---

## Características principales

* **Combate por turnos:** Registro con nickname único, selección y ordenamiento de mazo de 5 cartas (requiere mínimo 10 cartas activas en el catálogo) y enfrentamiento en arena contra 5 cartas rivales.
* **Sistema de estadísticas y habilidades:** Cartas con **250 HP** base sin recuperación entre rondas, cuatro ataques normales con factor aleatorio (`0.85` a `1.15`), acción de defensa con reducción del 50 % de daño y poder especial desbloqueable en el segundo turno con cooldown de 3 turnos propios.
* **Ranking global en vivo:** Tabla de posiciones ordenada de mayor a menor puntaje (`+50` puntos por victoria, `+10` puntos por derrota), destacando el Top 3 e historial acumulado.
* **Panel Admin CRUD:** Sección protegida mediante inicio de sesión para listar, crear, editar (`PUT`), activar/desactivar (`PATCH`) y eliminar (`DELETE`) cartas en tiempo real.

---

## Reglas de juego

1. **Preparación:** El jugador registra un nickname único validado contra la API, selecciona exactamente 5 cartas activas diferentes y define su orden de entrada.
2. **Inicio y turnos:** El primer turno se sortea aleatoriamente. En cada turno el jugador elige entre uno de sus 4 ataques, defenderse o activar su poder especial cuando esté disponible.
3. **Condición de victoria:** Cuando una carta llega a `0 HP`, entra la siguiente del mazo mientras la carta ganadora conserva su vida restante. Gana el participante que derrote las 5 cartas del oponente.

---

## Stack tecnológico

* **Frontend:** HTML5, CSS3 (variables personalizadas, animaciones por evento y diseño responsivo) y JavaScript ES6+ Modules.
* **Arquitectura:** Custom Elements (`HTMLElement`) nativos sin frameworks externos.
* **Backend / Persistencia:** REST API en [MockAPI.io](https://mockapi.io/) con los recursos `admins`, `players`, `cards` y `battles` (y respaldo base en `src/data/db.json`).
* **Activos:** Imágenes optimizadas en formato `.webp` y efectos de sonido integrados.

---

## Credenciales de administración (Evaluación)

* **Usuario:** `admin`
* **Contraseña:** `123`

---

## Estructura del proyecto

* `public/images/` — Logo y catálogo de cartas en `.webp`
* `public/sounds/` — Efectos de sonido de combate e interfaz
* `src/api/` — Conexión y endpoints de MockAPI (`Fetch API`)
* `src/assets/` — Estilos globales (`global.css`)
* `src/components/` — Web Components (`app`, `auth`, `deck`, `battle`, `leaderboard`, `admin`)
* `src/data/` — Dataset base de 20 cartas (`db.json`)
* `src/utils/` — Motor de combate, validadores y gestor de audio
* `src/app.js` — Punto de entrada principal
* `.env.example` — Plantilla de variables de entorno (`API_MODE`, `API_DEV_URL`, `API_PROD_URL`)

---

## Autores

* **Miguel Angel Jaimes Bernal** — [@SrMiguel-1](https://github.com/SrMiguel-1)
* **Juan David Vega** — [@judaveot05-art](https://github.com/judaveot05-art)
