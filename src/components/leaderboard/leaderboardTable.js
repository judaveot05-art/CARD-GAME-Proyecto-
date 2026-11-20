import { getPlayers } from '../../api/playersApi.js';
import { getBattles } from '../../api/battlesApi.js';

class LeaderboardTable extends HTMLElement {
  async connectedCallback() {
    this.innerHTML = `<div class="container"><div class="status-loading">Cargando clasificación ninja...</div></div>`;

    try {
      const [players, battles] = await Promise.all([getPlayers(), getBattles()]);

      // Ordenar jugadores de mayor a menor puntaje (desempate por victorias)
      const sortedPlayers = [...players].sort((a, b) => {
        const diffPoints = (Number(b.points) || 0) - (Number(a.points) || 0);
        if (diffPoints !== 0) return diffPoints;
        return (Number(b.wins) || 0) - (Number(a.wins) || 0);
      });

      this.render(sortedPlayers, battles);
    } catch (err) {
      this.innerHTML = `<div class="container"><div class="status-msg status-error">Error al cargar el ranking: ${err.message}</div></div>`;
    }
  }

  render(players, battles) {
    this.innerHTML = `
      <div class="container">
        <div class="panel">
          <div class="ranking-header">
            <div>
              <h2 class="section-title">Tabla de Posiciones Shinobi 🏆</h2>
              <p style="color: var(--text-secondary); font-size: 0.9rem;">
                Clasificación oficial ordenada por puntos acumulados en batalla.
              </p>
            </div>
            <button class="btn-primary" id="btn-new-match">⚔️ Nueva Batalla</button>
          </div>

          ${players.length === 0 ? `
            <div class="status-msg" style="background: var(--bg-elevated); color: var(--text-secondary);">
              Aún no hay jugadores registrados. ¡Juega la primera batalla para inaugurar el ranking!
            </div>
          ` : `
            <div style="overflow-x: auto;">
              <table class="ranking-table">
                <thead>
                  <tr>
                    <th>Posición</th>
                    <th>Shinobi</th>
                    <th>Aldea</th>
                    <th>Puntos</th>
                    <th>Victorias</th>
                    <th>Derrotas</th>
                    <th>Partidas</th>
                  </tr>
                </thead>
                <tbody>
                  ${players.map((p, index) => {
                    const pos = index + 1;
                    const rankClass = pos <= 3 ? `rank-${pos}` : '';
                    return `
                      <tr>
                        <td><span class="rank-badge ${rankClass}">${pos}</span></td>
                        <td><strong>${p.username}</strong></td>
                        <td style="color: var(--text-secondary);">${p.village || 'Hoja'}</td>
                        <td class="points-highlight">${p.points || 0} pts</td>
                        <td style="color: var(--hp-high); font-weight: 700;">${p.wins || 0}</td>
                        <td style="color: var(--hp-low);">${p.losses || 0}</td>
                        <td>${p.matchesPlayed || 0}</td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>
          `}

          <!-- Historial reciente de combates -->
          <h3 style="margin-top: 1.5rem; font-size: 1.05rem;">Últimos Combates Registrados</h3>
          <div class="history-list">
            ${battles.length === 0 ? `
              <p style="color: var(--text-muted); font-size: 0.88rem;">Sin combates registrados todavía.</p>
            ` : battles.slice().reverse().slice(0, 8).map(b => `
              <div class="history-item">
                <span><strong>${b.player1}</strong> vs <strong>${b.player2}</strong></span>
                <span>Ganador: <strong style="color: var(--accent-gold);">${b.winner}</strong> (+${b.pointsEarned || 100} pts)</span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    this.querySelector('#btn-new-match')?.addEventListener('click', () => {
      this.dispatchEvent(new CustomEvent('navigate', {
        detail: { view: 'register' },
        bubbles: true
      }));
    });
  }
}

customElements.define('leaderboard-table', LeaderboardTable);