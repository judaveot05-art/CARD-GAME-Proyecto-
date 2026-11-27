# Naruto Card Battle — 1 vs 1 Arena

Juego web de estrategia y combate de cartas por turnos ambientado en el universo de Naruto. Desarrollado con **JavaScript Vanilla (ES6+)** y arquitectura modular basada en **Web Components nativos**, con persistencia en la nube mediante **MockAPI**.

---

## Características principales

* **Combate 1 vs 1 por turnos:** Registro de dos jugadores, armado de mazos personalizados y arena de batalla en tiempo real con registro de acciones y efectos de sonido.
* **Sistema de estadísticas y elementos:** Cartas balanceadas con hasta **250 HP** máximos, atributos de ataque/defensa y ventajas elementales.
* **Ranking global en vivo:** Tabla de posiciones con historial de victorias, derrotas y puntaje acumulado de los jugadores.
* **Panel Admin CRUD:** Gestión completa del catálogo de cartas (crear, editar, eliminar y carga masiva inicial hacia la API).

---

## Stack tecnológico

* **Frontend:** HTML5, CSS3 (variables personalizadas y diseño responsivo) y JavaScript ES6+ Modules.
* **Arquitectura:** Custom Elements (`HTMLElement`) sin frameworks externos.
* **Backend / Persistencia:** REST API en [MockAPI.io](https://mockapi.io/) (`cards`, `players`, `battles`).
* **Activos:** Imágenes optimizadas en formato `.webp` y efectos de audio integrados.

---

## Estructura del proyecto

```text
CARD-GAME-Proyecto-/
├── public/
│   ├── images/          # Logo y catálogo de cartas en .webp
│   └── sounds/          # Efectos de sonido de combate e interfaz
├── src/
│   ├── api/             # Conexión y endpoints de MockAPI
│   ├── assets/          # Estilos globales (global.css)
│   ├── components/      # Web Components (app, auth, deck, battle, leaderboard, admin)
│   ├── data/            # Dataset base de cartas (db.json)
│   ├── utils/           # Utilidades, validadores y gestor de audio
│   └── app.js           # Punto de entrada principal
├── .env.example         # Plantilla de variables de entorno
├── .gitignore
└── index.html

## Archivos modificados

* **BattleArena.js**
* **battleEngine.js**
*Se actualizo estos archivos para aplicar lo pedido en el parcial.