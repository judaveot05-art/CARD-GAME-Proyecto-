//WEB COMPONENT(Seleccion de mazo)
import { getCards } from '../../api/cardsApi.js';
import { playSound } from '../../utils/SoundManager.js';

class DeckSelector extends HTMLElement {
  constructor() {
    super();
    this.allCards = [];
    this.currentTurn = 1; // 1 = Jugador 1, 2 = Jugador 2
    this.deck1 = [];
    this.deck2 = [];
    this.player1 = null;
    this.player2 = null;
  }

  setPlayers(player1, player2) {
    this.player1 = player1;
    this.player2 = player2;
  }

  async connectedCallback() {
    this.innerHTML = `<div class="container"><div class="status-loading">Cargando pergaminos ninja disponibles...</div></div>`;
    try {
      const cards = await getCards();
      // Filtrar solo cartas activas
      this.allCards = cards.filter(c => c.active !== false);

      // Si MockAPI aun esta vacio, cargar respaldo local de db.json
      if (this.allCards.length === 0) {
        const res = await fetch('./src/data/db.json');
        const localData = await res.json();
        this.allCards = (localData.cards || []).filter(c => c.active !== false);
      }

      this.render();
    } catch (err) {
      this.innerHTML = `<div class="container"><div class="status-msg status-error">No se pudieron cargar las cartas: ${err.message}</div></div>`;
    }
  }

  get activeDeck() {
    return this.currentTurn === 1 ? this.deck1 : this.deck2;
  }

  get activePlayer() {
    return this.currentTurn === 1 ? this.player1 : this.player2;
  }

  render() {
    const selectedIds = this.activeDeck.map(c => String(c.id));
    const isP1 = this.currentTurn === 1;

    this.innerHTML = `
      <div class="container">
        <div class="panel">
          <!-- Indicador visual de Jugador 1 vs Jugador 2 -->
          <div style="display: flex; gap: 0.75rem; margin-bottom: 1.25rem; flex-wrap: wrap;">
            <div style="flex: 1; min-width: 220px; padding: 0.85rem 1rem; border-radius: var(--radius-md); border: 2px solid ${isP1 ? 'var(--accent-orange)' : 'var(--border-subtle)'}; background: ${isP1 ? 'rgba(255, 107, 0, 0.14)' : 'var(--bg-elevated)'};">
              <div style="font-size: 0.75rem; text-transform: uppercase; color: var(--accent-orange); font-weight: 700; margin-bottom: 0.2rem;">
                ${isP1 ? '👉 Eligiendo ahora' : '✅ Mazo Confirmado'}
              </div>
              <strong style="font-size: 1.05rem;">Jugador 1: ${this.player1?.username || 'J1'}</strong>
              <span style="font-size: 0.85rem; color: var(--text-secondary);"> (${this.deck1.length}/5 cartas)</span>
            </div>

            <div style="flex: 1; min-width: 220px; padding: 0.85rem 1rem; border-radius: var(--radius-md); border: 2px solid ${!isP1 ? '#38bdf8' : 'var(--border-subtle)'}; background: ${!isP1 ? 'rgba(56, 189, 248, 0.14)' : 'var(--bg-elevated)'};">
              <div style="font-size: 0.75rem; text-transform: uppercase; color: #38bdf8; font-weight: 700; margin-bottom: 0.2rem;">
                ${!isP1 ? '👉 Eligiendo ahora' : '⏳ Esperando turno'}
              </div>
              <strong style="font-size: 1.05rem;">Jugador 2: ${this.player2?.username || 'J2'}</strong>
              <span style="font-size: 0.85rem; color: var(--text-secondary);"> (${this.deck2.length}/5 cartas)</span>
            </div>
          </div>

          <div class="deck-header">
            <div>
              <h2 class="section-title">
                Turno de <span style="color: ${isP1 ? 'var(--accent-orange)' : '#38bdf8'};">${this.activePlayer?.username || 'Jugador'}</span>
              </h2>
              <p style="color: var(--text-secondary);">Elige exactamente 5 cartas para tu equipo de combate.</p>
            </div>

            <div style="display: flex; align-items: center; gap: 1rem;">
              <span class="deck-counter">Seleccionadas: ${this.activeDeck.length} / 5</span>
              <button class="btn-primary" id="btn-confirm-deck" ${this.activeDeck.length !== 5 ? 'disabled' : ''}>
                ${isP1 ? `Confirmar Mazo de ${this.player1?.username || 'J1'} →` : '¡Iniciar Batalla! ⚔️'}
              </button>
            </div>
          </div>

          <div class="cards-selection-grid">
            ${this.allCards.map(card => {
              const isSelected = selectedIds.includes(String(card.id));
              return `
                <div class="selectable-card ${isSelected ? 'selected' : ''}" data-id="${card.id}">
                  <div>
                    <img src="${card.image || './public/images/cards/default.png'}" alt="${card.name}" onerror="this.src='https://placehold.co/300x200/1b1f2a/edf0f5?text=${encodeURIComponent(card.name)}'" />
                    <div class="card-meta">
                      <span class="badge-type" data-type="${card.type}">${card.type}</span>
                      <span class="card-hp-tag">HP ${card.hp || 250}</span>
                    </div>
                    <h4 style="margin-bottom: 0.35rem;">${card.name}</h4>
                    <p style="font-size: 0.8rem; color: var(--text-secondary);">
                      Especial: ${card.special?.name || 'Jutsu Secreto'} (${card.special?.damage || 75} dmg)
                    </p>
                  </div>
                  <div style="margin-top: 0.75rem; font-size: 0.8rem; font-weight: 700; color: ${isSelected ? 'var(--accent-orange)' : 'var(--text-muted)'};">
                    ${isSelected ? '✔️ En tu mazo' : '+ Clic para elegir'}
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>
    `;

    this.attachEvents();
  }

  attachEvents() {
    this.querySelectorAll('.selectable-card').forEach(el => {
      el.addEventListener('click', () => {
        const id = el.dataset.id;
        const card = this.allCards.find(c => String(c.id) === String(id));
        if (!card) return;

        const index = this.activeDeck.findIndex(c => String(c.id) === String(id));
        if (index >= 0) {
          this.activeDeck.splice(index, 1);
          playSound('./public/sounds/click.mp3');
        } else if (this.activeDeck.length < 5) {
          // Clonar carta con estado inicial de combate
          this.activeDeck.push(JSON.parse(JSON.stringify(card)));
          playSound('./public/sounds/select.mp3');
        }
        this.render();
      });
    });

    const confirmBtn = this.querySelector('#btn-confirm-deck');
    confirmBtn?.addEventListener('click', () => {
      if (this.activeDeck.length !== 5) return;
      playSound('./public/sounds/confirm.mp3');

      if (this.currentTurn === 1) {
        this.currentTurn = 2;
        this.render();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        // Enviar mazos listos a <card-game-app>
        this.dispatchEvent(new CustomEvent('decks-ready', {
          detail: {
            player1: this.player1,
            player2: this.player2,
            deck1: this.deck1,
            deck2: this.deck2
          },
          bubbles: true
        }));
      }
    });
  }
}

customElements.define('deck-selector', DeckSelector);