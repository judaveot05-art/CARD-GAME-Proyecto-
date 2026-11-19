import { getPlayers, postPlayer } from '../../api/playersApi.js';
import { playSound } from '../../utils/soundManager.js';

class PlayerRegister extends HTMLElement {
  connectedCallback() {
    this.render();
    this.attachEvents();
  }

  render() {
    this.innerHTML = `
      <div class="container auth-wrapper">
        <div class="panel">
          <h2 class="section-title">Registro de Shinobis (1 vs 1)</h2>
          <p style="color: var(--text-secondary); margin-bottom: 1rem;">
            Ingresa los nombres de ambos jugadores. Si ya existen en el ranking, se cargará su historial.
          </p>

          <form id="register-form">
            <div class="auth-grid">
              <!-- Jugador 1 -->
              <div class="player-box p1">
                <h3>Jugador 1 (Konoha)</h3>
                <div class="field-group">
                  <label for="p1-name">Nombre Ninja *</label>
                  <input type="text" id="p1-name" placeholder="Ej: NarutoUzumaki" required minlength="3" />
                </div>
                <div class="field-group">
                  <label for="p1-village">Aldea (Opcional)</label>
                  <select id="p1-village">
                    <option value="Hoja">Aldea de la Hoja</option>
                    <option value="Arena">Aldea de la Arena</option>
                    <option value="Niebla">Aldea de la Niebla</option>
                    <option value="Nube">Aldea de la Nube</option>
                    <option value="Roca">Aldea de la Roca</option>
                  </select>
                </div>
              </div>

              <!-- Jugador 2 -->
              <div class="player-box p2">
                <h3>Jugador 2 (Rival)</h3>
                <div class="field-group">
                  <label for="p2-name">Nombre Ninja *</label>
                  <input type="text" id="p2-name" placeholder="Ej: SasukeUchiha" required minlength="3" />
                </div>
                <div class="field-group">
                  <label for="p2-village">Aldea (Opcional)</label>
                  <select id="p2-village">
                    <option value="Hoja">Aldea de la Hoja</option>
                    <option value="Arena">Aldea de la Arena</option>
                    <option value="Niebla">Aldea de la Niebla</option>
                    <option value="Nube">Aldea de la Nube</option>
                    <option value="Roca">Aldea de la Roca</option>
                  </select>
                </div>
              </div>
            </div>

            <div id="auth-status"></div>

            <div class="auth-actions">
              <button type="submit" class="btn-primary" id="btn-start-register">
                Continuar a Selección de Mazo →
              </button>
            </div>
          </form>
        </div>
      </div>
    `;
  }

  attachEvents() {
    const form = this.querySelector('#register-form');
    const statusBox = this.querySelector('#auth-status');
    const submitBtn = this.querySelector('#btn-start-register');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      playSound('./public/sounds/click.mp3');

      const name1 = this.querySelector('#p1-name').value.trim();
      const village1 = this.querySelector('#p1-village').value;
      const name2 = this.querySelector('#p2-name').value.trim();
      const village2 = this.querySelector('#p2-village').value;

      // Validar que no sean el mismo jugador
      if (name1.toLowerCase() === name2.toLowerCase()) {
        statusBox.innerHTML = <div class="status-msg status-error">Los dos jugadores deben tener nombres distintos.</div>;
        return;
      }

      submitBtn.disabled = true;
      statusBox.innerHTML = <div class="status-loading">Verificando ninjas en la base de datos...</div>;

      try {
        const existingPlayers = await getPlayers();

        // Buscar o crear Jugador 1
        let player1 = existingPlayers.find(p => p.username.toLowerCase() === name1.toLowerCase());
        if (!player1) {
          player1 = await postPlayer({
            username: name1,
            village: village1,
            points: 0,
            wins: 0,
            losses: 0,
            matchesPlayed: 0
          });
        }

        // Buscar o crear Jugador 2
        let player2 = existingPlayers.find(p => p.username.toLowerCase() === name2.toLowerCase());
        if (!player2) {
          player2 = await postPlayer({
            username: name2,
            village: village2,
            points: 0,
            wins: 0,
            losses: 0,
            matchesPlayed: 0
          });
        }

        // Notificar a <card-game-app> para avanzar a la selección de mazo
        this.dispatchEvent(new CustomEvent('players-ready', {
          detail: { player1, player2 },
          bubbles: true
        }));
      } catch (err) {
        statusBox.innerHTML = <div class="status-msg status-error">Error de conexión con MockAPI: ${err.message}</div>;
        submitBtn.disabled = false;
      }
    });
  }
}

customElements.define('player-register', PlayerRegister);