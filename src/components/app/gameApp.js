class CardGameApp extends HTMLElement {
  constructor() {
    super();
    this.currentView = 'register'; // 'register' | 'deck' | 'battle' | 'leaderboard' | 'admin'
    this.matchData = null;
  }

  connectedCallback() {
    this.render();
    this.attachEvents();
  }

  render() {
    this.innerHTML = `
      <header style="background-color: var(--bg-surface); border-bottom: 1px solid var(--border-subtle); padding: 0.9rem 1.5rem;">
        <div class="container" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
          <div style="display: flex; align-items: center; gap: 0.6rem; cursor: pointer;" id="nav-brand">
            <span style="font-size: 1.4rem;">🍥</span>
            <strong style="font-size: 1.15rem; color: var(--text-primary); letter-spacing: 0.03em;">
              NARUTO <span style="color: var(--accent-orange);">CARD BATTLE</span>
            </strong>
          </div>

          <nav style="display: flex; gap: 0.65rem; flex-wrap: wrap;">
            <button class="${this.currentView === 'register' ? 'btn-primary' : 'btn-secondary'}" data-view="register">
              ⚔️ Jugar (1 vs 1)
            </button>
            <button class="${this.currentView === 'leaderboard' ? 'btn-primary' : 'btn-secondary'}" data-view="leaderboard">
              🏆 Ranking
            </button>
            <button class="${this.currentView === 'admin' ? 'btn-primary' : 'btn-secondary'}" data-view="admin">
              🔐 Admin CRUD
            </button>
          </nav>
        </div>
      </header>

      <main id="app-viewport" style="padding: 1.5rem 0 3rem;">
        ${this.renderCurrentView()}
      </main>
    `;

    // Pasar datos dinámicos si estamos en selección de mazo o batalla
    if (this.currentView === 'deck' && this.matchData) {
      const deckEl = this.querySelector('deck-selector');
      deckEl?.setPlayers(this.matchData.player1, this.matchData.player2);
    }

    if (this.currentView === 'battle' && this.matchData) {
      const battleEl = this.querySelector('battle-arena');
      battleEl?.setupBattle(this.matchData);
      battleEl?.render();
    }
  }

  renderCurrentView() {
    switch (this.currentView) {
      case 'register':
        return `<player-register></player-register>`;
      case 'deck':
        return `<deck-selector></deck-selector>`;
      case 'battle':
        return `<battle-arena></battle-arena>`;
      case 'leaderboard':
        return `<leaderboard-table></leaderboard-table>`;
      case 'admin':
        return `<admin-crud></admin-crud>`;
      default:
        return `<player-register></player-register>`;
    }
  }

  attachEvents() {
    // Navegación superior
    this.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-view]');
      if (btn) {
        this.currentView = btn.dataset.view;
        this.render();
      }
      if (e.target.closest('#nav-brand')) {
        this.currentView = 'register';
        this.render();
      }
    });

    // Evento emitido por <player-register>
    this.addEventListener('players-ready', (e) => {
      this.matchData = {
        player1: e.detail.player1,
        player2: e.detail.player2
      };
      this.currentView = 'deck';
      this.render();
    });

    // Evento emitido por <deck-selector>
    this.addEventListener('decks-ready', (e) => {
      this.matchData = e.detail;
      this.currentView = 'battle';
      this.render();
    });

    // Evento de navegación interna (ej. ir al ranking al terminar batalla)
    this.addEventListener('navigate', (e) => {
      this.currentView = e.detail.view;
      this.render();
    });
  }
}

customElements.define('card-game-app', CardGameApp);