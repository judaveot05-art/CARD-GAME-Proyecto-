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
          <div style="display: flex; align-items: center; gap: 0.75rem; cursor: pointer;" id="nav-brand">
            <div style="
              width: 44px;
              height: 44px;
              border-radius: 50%;
              background: radial-gradient(circle, rgba(255, 136, 0, 0.35) 0%, rgba(255, 102, 0, 0.12) 70%);
              border: 2px solid var(--accent-orange);
              box-shadow: 0 0 12px rgba(255, 119, 0, 0.55);
              display: flex;
              align-items: center;
              justify-content: center;
              padding: 5px;
              flex-shrink: 0;
            ">
              <img 
                src="./public/images/icono-pagina.png" 
                alt="Naruto Card Battle Logo" 
                style="
                  width: 100%;
                  height: 100%;
                  object-fit: contain;
                  filter: brightness(2.2) contrast(1.2) drop-shadow(0 0 3px #ff8800);
                "
              />
            </div>
            <strong style="font-size: 1.2rem; color: var(--text-primary); letter-spacing: 0.03em;">
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

    if (this.currentView === 'deck' && this.matchData) {
      const deckEl = this.querySelector('deck-selector');
      if (deckEl && typeof deckEl.setPlayers === 'function') {
        deckEl.setPlayers(this.matchData.player1, this.matchData.player2);
      }
    }

    if (this.currentView === 'battle' && this.matchData) {
      const battleEl = this.querySelector('battle-arena');
      battleEl?.setupBattle(this.matchData);
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

    // Evento emitido por <deck-selector>: conservamos player1 y player2
    this.addEventListener('decks-ready', (e) => {
      this.matchData = {
        ...this.matchData,
        player1: e.detail.player1 || this.matchData?.player1 || { username: 'Jugador 1' },
        player2: e.detail.player2 || this.matchData?.player2 || { username: 'Jugador 2' },
        deck1: e.detail.deck1,
        deck2: e.detail.deck2
      };
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