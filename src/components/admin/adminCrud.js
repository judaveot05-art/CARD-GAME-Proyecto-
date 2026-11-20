import { getAdmins } from '../../api/adminApi.js';
import { getCards, postCard, putCard, patchCard, deleteCard } from '../../api/cardsApi.js';

class AdminCrud extends HTMLElement {
  constructor() {
    super();
    this.isAuthenticated = sessionStorage.getItem('naruto_admin_auth') === 'true';
    this.cards = [];
    this.editingCard = null;
  }

  async connectedCallback() {
    if (!this.isAuthenticated) {
      this.renderLogin();
    } else {
      await this.loadCardsAndRender();
    }
  }

  renderLogin() {
    this.innerHTML = `
      <div class="container admin-login-box">
        <div class="panel">
          <h2 class="section-title">Acceso Hokage (Admin)</h2>
          <p style="color: var(--text-secondary); margin-bottom: 1.25rem; font-size: 0.9rem;">
            Inicia sesión para gestionar el catálogo de cartas ninja.
          </p>

          <form id="admin-login-form">
            <div style="margin-bottom: 1rem;">
              <label for="admin-user">Usuario</label>
              <input type="text" id="admin-user" placeholder="admin" required />
            </div>

            <div style="margin-bottom: 1rem;">
              <label for="admin-pass">Contraseña</label>
              <input type="password" id="admin-pass" placeholder="123" required />
            </div>

            <div id="login-msg"></div>

            <button type="submit" class="btn-primary" style="width: 100%; margin-top: 0.5rem;">
              Ingresar al Panel
            </button>
          </form>
        </div>
      </div>
    `;

    this.querySelector('#admin-login-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const user = this.querySelector('#admin-user').value.trim();
      const pass = this.querySelector('#admin-pass').value.trim();
      const msgBox = this.querySelector('#login-msg');

      try {
        const admins = await getAdmins();
        const found = admins.find(a => a.username === user && a.password === pass);

        if (!found) {
          msgBox.innerHTML = `<div class="status-msg status-error">Credenciales incorrectas. Prueba con admin / 123</div>`;
          return;
        }

        this.isAuthenticated = true;
        sessionStorage.setItem('naruto_admin_auth', 'true');
        await this.loadCardsAndRender();
      } catch (err) {
        msgBox.innerHTML = `<div class="status-msg status-error">Error: ${err.message}</div>`;
      }
    });
  }

  async loadCardsAndRender() {
    this.innerHTML = `<div class="container"><div class="status-loading">Cargando cartas desde MockAPI...</div></div>`;
    try {
      this.cards = await getCards();
      this.renderDashboard();
    } catch (err) {
      this.innerHTML = `<div class="container"><div class="status-msg status-error">Error al cargar cartas: ${err.message}</div></div>`;
    }
  }

  renderDashboard() {
    const c = this.editingCard;

    this.innerHTML = `
      <div class="container">
        <div class="panel">
          <div class="admin-header">
            <div>
              <h2 class="section-title">Gestión de Cartas Shinobi (CRUD)</h2>
              <p style="color: var(--text-secondary); font-size: 0.9rem;">
                Total en MockAPI: <strong>${this.cards.length}</strong> cartas registradas.
              </p>
            </div>

            <div class="admin-actions-bar">
              ${this.cards.length === 0 ? `
                <button class="btn-chakra" id="btn-seed-cards">
                  ⚡ Cargar 20 Cartas Iniciales a MockAPI
                </button>
              ` : ''}
              <button class="btn-secondary" id="btn-logout-admin">Cerrar Sesión</button>
            </div>
          </div>

          <!-- Formulario Crear / Editar Carta -->
          <form id="card-crud-form" style="background: var(--bg-elevated); padding: 1.25rem; border-radius: var(--radius-md); border: 1px solid var(--border-subtle);">
            <h3 style="margin-bottom: 1rem; color: var(--accent-orange);">
              ${c ? `Editando Carta: ${c.name}` : 'Registrar Nueva Carta'}
            </h3>

            <div class="crud-form-grid">
              <div>
                <label>Nombre del Personaje *</label>
                <input type="text" id="card-name" value="${c?.name || ''}" placeholder="Ej: Rock Lee" required />
              </div>

              <div>
                <label>Naturaleza de Chakra *</label>
                <select id="card-type">
                  ${['Fuego', 'Agua', 'Rayo', 'Tierra', 'Viento'].map(t => `
                    <option value="${t}" ${c?.type === t ? 'selected' : ''}>${t}</option>
                  `).join('')}
                </select>
              </div>

              <div>
                <label>Puntos de Vida (HP) *</label>
                <input type="number" id="card-hp" value="${c?.hp || 250}" min="100" max="500" required />
              </div>

              <div>
                <label>URL o Ruta de Imagen</label>
                <input type="text" id="card-image" value="${c?.image || './public/images/cards/Naruto_newshot.webp'}" />
              </div>

              <div>
                <label>Ataque 1 (Nombre) *</label>
                <input type="text" id="atk1-name" value="${c?.attacks?.[0]?.name || ''}" placeholder="Ej: Loto Primario" required />
              </div>

              <div>
                <label>Ataque 1 (Daño) *</label>
                <input type="number" id="atk1-dmg" value="${c?.attacks?.[0]?.damage || 40}" min="10" max="150" required />
              </div>

              <div>
                <label>Ataque 2 (Nombre) *</label>
                <input type="text" id="atk2-name" value="${c?.attacks?.[1]?.name || ''}" placeholder="Ej: Huracán de la Hoja" required />
              </div>

              <div>
                <label>Ataque 2 (Daño) *</label>
                <input type="number" id="atk2-dmg" value="${c?.attacks?.[1]?.damage || 55}" min="10" max="150" required />
              </div>

              <div>
                <label>Poder Especial (Nombre) *</label>
                <input type="text" id="spec-name" value="${c?.special?.name || ''}" placeholder="Ej: Octava Puerta" required />
              </div>

              <div>
                <label>Poder Especial (Daño) *</label>
                <input type="number" id="spec-dmg" value="${c?.special?.damage || 85}" min="20" max="200" required />
              </div>
            </div>

            <div id="crud-feedback"></div>

            <div style="display: flex; gap: 0.75rem; margin-top: 1rem;">
              <button type="submit" class="btn-primary">
                ${c ? 'Guardar Cambios (PUT)' : 'Crear Carta (POST)'}
              </button>
              ${c ? `<button type="button" class="btn-secondary" id="btn-cancel-edit">Cancelar Edición</button>` : ''}
            </div>
          </form>

          <!-- Tabla de Cartas -->
          <div style="overflow-x: auto;">
            <table class="admin-cards-table">
              <thead>
                <tr>
                  <th>Personaje</th>
                  <th>Tipo</th>
                  <th>HP</th>
                  <th>Especial</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                ${this.cards.map(card => `
                  <tr class="${card.active === false ? 'row-inactive' : ''}">
                    <td><strong>${card.name}</strong></td>
                    <td><span class="badge-type" data-type="${card.type}">${card.type}</span></td>
                    <td>${card.hp}</td>
                    <td>${card.special?.name || '-'} (${card.special?.damage || 0})</td>
                    <td>${card.active === false ? 'Inactiva' : 'Activa'}</td>
                    <td class="table-actions">
                      <button class="btn-secondary btn-sm btn-edit" data-id="${card.id}">Editar</button>
                      <button class="btn-chakra btn-sm btn-toggle" data-id="${card.id}">
                        ${card.active === false ? 'Activar' : 'Desactivar'}
                      </button>
                      <button class="btn-danger btn-sm btn-delete" data-id="${card.id}">Eliminar</button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    this.attachDashboardEvents();
  }

  attachDashboardEvents() {
    // Cerrar sesión
    this.querySelector('#btn-logout-admin')?.addEventListener('click', () => {
      sessionStorage.removeItem('naruto_admin_auth');
      this.isAuthenticated = false;
      this.renderLogin();
    });

    // Sembrar las 20 cartas desde db.json hacia MockAPI
    this.querySelector('#btn-seed-cards')?.addEventListener('click', async (e) => {
      const btn = e.target;
      btn.disabled = true;
      btn.textContent = 'Subiendo 20 cartas a MockAPI...';
      try {
        const res = await fetch('./src/data/db.json');
        const data = await res.json();
        for (const card of data.cards) {
          const { id, ...cardWithoutId } = card;
          await postCard(cardWithoutId);
        }
        await this.loadCardsAndRender();
      } catch (err) {
        alert('Error al cargar cartas iniciales: ' + err.message);
        btn.disabled = false;
      }
    });

    // Cancelar edición
    this.querySelector('#btn-cancel-edit')?.addEventListener('click', () => {
      this.editingCard = null;
      this.renderDashboard();
    });

    // Guardar POST o PUT
    this.querySelector('#card-crud-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const payload = {
        name: this.querySelector('#card-name').value.trim(),
        type: this.querySelector('#card-type').value,
        hp: Number(this.querySelector('#card-hp').value),
        image: this.querySelector('#card-image').value.trim(),
        attacks: [
          {
            name: this.querySelector('#atk1-name').value.trim(),
            damage: Number(this.querySelector('#atk1-dmg').value)
          },
          {
            name: this.querySelector('#atk2-name').value.trim(),
            damage: Number(this.querySelector('#atk2-dmg').value)
          }
        ],
        special: {
          name: this.querySelector('#spec-name').value.trim(),
          damage: Number(this.querySelector('#spec-dmg').value),
          cooldown: 2
        },
        active: this.editingCard ? this.editingCard.active : true
      };

      try {
        if (this.editingCard) {
          await putCard(payload, this.editingCard.id);
          this.editingCard = null;
        } else {
          await postCard(payload);
        }
        await this.loadCardsAndRender();
      } catch (err) {
        this.querySelector('#crud-feedback').innerHTML =
          `<div class="status-msg status-error">Error al guardar: ${err.message}</div>`;
      }
    });

    // Editar (cargar datos en formulario)
    this.querySelectorAll('.btn-edit').forEach(btn => {
      btn.addEventListener('click', () => {
        this.editingCard = this.cards.find(c => String(c.id) === String(btn.dataset.id));
        this.renderDashboard();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    });

    // PATCH: Activar / Desactivar
    this.querySelectorAll('.btn-toggle').forEach(btn => {
      btn.addEventListener('click', async () => {
        const card = this.cards.find(c => String(c.id) === String(btn.dataset.id));
        if (!card) return;
        try {
          await patchCard({ active: card.active === false ? true : false }, card.id);
          await this.loadCardsAndRender();
        } catch (err) {
          alert('Error al cambiar estado: ' + err.message);
        }
      });
    });

    // DELETE: Eliminar carta
    this.querySelectorAll('.btn-delete').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm('¿Seguro que deseas eliminar esta carta de MockAPI?')) return;
        try {
          await deleteCard(btn.dataset.id);
          await this.loadCardsAndRender();
        } catch (err) {
          alert('Error al eliminar: ' + err.message);
        }
      });
    });
  }
}

customElements.define('admin-crud', AdminCrud);