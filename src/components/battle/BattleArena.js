//WEB COMPONENT(Arena de batalla 1vs1)
import { calculateDamage } from '../../utils/battleEngine.js';
import { playSound } from '../../utils/SoundManager.js';
import { putPlayer } from '../../api/playersApi.js';
import { postBattle } from '../../api/battlesApi.js';

class BattleArena extends HTMLElement {
  constructor() {
    super();
    this.turn = 1; // 1 o 2
    this.logs = [];
    this.finished = false;
  }

  setupBattle({ player1, player2, deck1, deck2 }) {
    this.player1 = player1;
    this.player2 = player2;

    // Inicializar estado de combate para cada carta (250 HP por defecto)
    this.team1 = deck1.map(c => ({
      ...c,
      maxHp: Number(c.hp) || 250,
      currentHp: Number(c.hp) || 250,
      isDefending: false,
      specialCooldown: 0
    }));

    this.team2 = deck2.map(c => ({
      ...c,
      maxHp: Number(c.hp) || 250,
      currentHp: Number(c.hp) || 250,
      isDefending: false,
      specialCooldown: 0
    }));

    this.activeIdx1 = 0;
    this.activeIdx2 = 0;
    this.turn = 1;
    this.finished = false;
    this.logs = [`¡Comienza el combate entre ${player1.username} y ${player2.username}!`];
    this.render();
  }

  connectedCallback() {
    if (this.team1 && this.team2) {
      this.render();
    }
  }

  get activeCard1() {
    return this.team1[this.activeIdx1];
  }

  get activeCard2() {
    return this.team2[this.activeIdx2];
  }

  getHpColor(current, max) {
    const pct = (current / max) * 100;
    if (pct > 50) return 'var(--hp-high)';
    if (pct > 25) return 'var(--hp-mid)';
    return 'var(--hp-low)';
  }

  addLog(msg) {
    this.logs.unshift(msg);
  }

  render() {
    const c1 = this.activeCard1;
    const c2 = this.activeCard2;
    const attacker = this.turn === 1 ? c1 : c2;
    const activePlayerName = this.turn === 1 ? this.player1.username : this.player2.username;

    this.innerHTML = `
      <div class="container">
        <!-- Barra superior de estado -->
        <div class="battle-topbar">
          <div class="turn-banner">
            ${this.finished ? '🏆 ¡Combate Finalizado!' : `⚡ Turno de: ${activePlayerName}`}
          </div>
          <div style="font-size: 0.9rem; color: var(--text-secondary);">
            Vivas J1: <strong>${this.team1.filter(c => c.currentHp > 0).length}/5</strong> |
            Vivas J2: <strong>${this.team2.filter(c => c.currentHp > 0).length}/5</strong>
          </div>
        </div>

        <!-- Campo de combate -->
        <div class="arena-field">
          ${this.renderFighterZone(this.player1, c1, this.team1, this.activeIdx1, 1)}
          ${this.renderFighterZone(this.player2, c2, this.team2, this.activeIdx2, 2)}
        </div>

        <!-- Panel de acciones del turno activo -->
        ${!this.finished ? `
          <div class="actions-panel">
            <h3 style="margin-bottom: 0.35rem;">Acciones de ${attacker.name} (${activePlayerName})</h3>
            <p style="font-size: 0.85rem; color: var(--text-secondary);">
              Selecciona un jutsu de ataque, activa defensa (50% reducción) o cambia de shinobi.
            </p>

            <div class="attacks-grid">
              ${(attacker.attacks || []).map((atk, idx) => `
                <button class="btn-primary btn-attack" data-idx="${idx}">
                  ⚔️ ${atk.name} (${atk.damage})
                </button>
              `).join('')}

              <button class="btn-chakra" id="btn-special" ${attacker.specialCooldown > 0 ? 'disabled' : ''}>
                🔥 ${attacker.special?.name || 'Poder Especial'} (${attacker.special?.damage || 75})
                ${attacker.specialCooldown > 0 ? `[CD: ${attacker.specialCooldown}]` : ''}
              </button>

              <button class="btn-secondary" id="btn-defend">
                🛡️ Postura Defensiva (50%)
              </button>
            </div>
          </div>
        ` : `
          <div class="panel" style="text-align: center; margin-bottom: 1.25rem;">
            <h2 style="color: var(--accent-gold); margin-bottom: 0.5rem;">${this.logs[0]}</h2>
            <p style="color: var(--text-secondary); margin-bottom: 1rem;">Los puntos y estadísticas ya fueron guardados en el Ranking.</p>
            <button class="btn-primary" id="btn-go-ranking">Ver Tabla de Posiciones 🏆</button>
          </div>
        `}

        <!-- Historial de turnos -->
        <div class="battle-log">
          ${this.logs.map(line => `<p>• ${line}</p>`).join('')}
        </div>
      </div>
    `;

    this.attachEvents();
  }

  renderFighterZone(player, card, team, activeIdx, playerNum) {
    const pct = Math.max(0, (card.currentHp / card.maxHp) * 100);
    const isTurn = !this.finished && this.turn === playerNum;

    return `
      <div class="fighter-zone ${isTurn ? 'active-turn' : ''}">
        <div class="fighter-header">
          <span style="font-weight: 700;">${player.username}</span>
          <span class="badge-type" data-type="${card.type}">${card.type}</span>
        </div>

        <div class="fighter-visual">
          <img src="${card.image || './public/images/cards/default.png'}" alt="${card.name}" onerror="this.src='https://placehold.co/150x150/1b1f2a/edf0f5?text=Ninja'" />
          <div style="flex: 1;">
            <h3>${card.name} ${card.isDefending ? '🛡️' : ''}</h3>
            <div class="hp-bar-bg">
              <div class="hp-bar-fill" style="width: ${pct}%; background-color: ${this.getHpColor(card.currentHp, card.maxHp)};"></div>
            </div>
            <div style="font-size: 0.85rem; font-weight: 700;">
              HP: ${card.currentHp} / ${card.maxHp}
            </div>
          </div>
        </div>

        <!-- Banca de 5 cartas (clic para relevar si es tu turno) -->
        <div class="bench-strip">
          ${team.map((member, idx) => `
            <div
              class="bench-pill ${idx === activeIdx ? 'current' : ''} ${member.currentHp <= 0 ? 'ko' : ''}"
              data-player="${playerNum}"
              data-idx="${idx}"
              title="${member.name} (${member.currentHp} HP)"
            >
              ${member.name.split(' ')[0]}<br/>${member.currentHp}HP
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  attachEvents() {
    if (this.finished) {
      this.querySelector('#btn-go-ranking')?.addEventListener('click', () => {
        this.dispatchEvent(new CustomEvent('navigate', {
          detail: { view: 'leaderboard' },
          bubbles: true
        }));
      });
      return;
    }

    const attacker = this.turn === 1 ? this.activeCard1 : this.activeCard2;
    const defender = this.turn === 1 ? this.activeCard2 : this.activeCard1;

    // 1. Ataques normales
    this.querySelectorAll('.btn-attack').forEach(btn => {
      btn.addEventListener('click', () => {
        const atk = attacker.attacks[Number(btn.dataset.idx)];
        playSound('./public/sounds/attack.mp3');
        this.executeStrike(attacker, defender, atk.name, atk.damage, false);
      });
    });

    // 2. Poder especial (con cooldown de 2 turnos)
    this.querySelector('#btn-special')?.addEventListener('click', () => {
      if (attacker.specialCooldown > 0) return;
      playSound('./public/sounds/special.mp3');
      attacker.specialCooldown = attacker.special?.cooldown || 2;
      this.executeStrike(
        attacker,
        defender,
        attacker.special?.name || 'Poder Especial',
        attacker.special?.damage || 75,
        true
      );
    });

    // 3. Defensa (reduce 50% el siguiente golpe recibido)
    this.querySelector('#btn-defend')?.addEventListener('click', () => {
      playSound('./public/sounds/defend.mp3');
      attacker.isDefending = true;
      this.addLog(`${attacker.name} adopta postura defensiva (daño reducido al 50%).`);
      this.nextTurn();
    });

    // 4. Cambio de carta activa desde la banca
    this.querySelectorAll('.bench-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        const pNum = Number(pill.dataset.player);
        const idx = Number(pill.dataset.idx);
        if (pNum !== this.turn) return;

        const team = pNum === 1 ? this.team1 : this.team2;
        const currentIdx = pNum === 1 ? this.activeIdx1 : this.activeIdx2;

        if (idx === currentIdx || team[idx].currentHp <= 0) return;

        if (pNum === 1) this.activeIdx1 = idx;
        else this.activeIdx2 = idx;

        playSound('./public/sounds/select.mp3');
        this.addLog(`Cambio táctico: entra ${team[idx].name} al combate.`);
        this.nextTurn();
      });
    });
  }

  executeStrike(attacker, defender, moveName, baseDamage, isSpecial) {
    // Limpiar defensa propia al atacar
    attacker.isDefending = false;

    const { finalDamage, note } = calculateDamage(
      baseDamage,
      attacker.type,
      defender.type,
      defender.isDefending
    );

    // Consumir postura defensiva del rival tras recibir el impacto
    defender.isDefending = false;
    defender.currentHp = Math.max(0, defender.currentHp - finalDamage);

    this.addLog(
      `${attacker.name} usa ${moveName} contra ${defender.name} y causa ${finalDamage} de daño. ${note}`
    );

    // Verificar si la carta defensora fue derrotada
    if (defender.currentHp === 0) {
      playSound('./public/sounds/ko.mp3');
      this.addLog(`💥 ¡${defender.name} ha quedado fuera de combate!`);

      const defenderTeam = this.turn === 1 ? this.team2 : this.team1;
      const nextAliveIdx = defenderTeam.findIndex(c => c.currentHp > 0);

      if (nextAliveIdx === -1) {
        this.finishMatch();
        return;
      } else {
        if (this.turn === 1) this.activeIdx2 = nextAliveIdx;
        else this.activeIdx1 = nextAliveIdx;
        this.addLog(`Entra de relevo ${defenderTeam[nextAliveIdx].name}.`);
      }
    }

    this.nextTurn();
  }

  nextTurn() {
    // Reducir cooldowns de la carta que acaba de terminar su turno
    const currentCard = this.turn === 1 ? this.activeCard1 : this.activeCard2;
    if (currentCard.specialCooldown > 0) {
      currentCard.specialCooldown -= 1;
    }

    this.turn = this.turn === 1 ? 2 : 1;
    this.render();
  }

  async finishMatch() {
    this.finished = true;
    playSound('./public/sounds/victory.mp3');

    const winner = this.turn === 1 ? this.player1 : this.player2;
    const loser = this.turn === 1 ? this.player2 : this.player1;
    const survivorCount = (this.turn === 1 ? this.team1 : this.team2).filter(c => c.currentHp > 0).length;

    // Puntos: +100 por victoria + 15 por cada carta sobreviviente
    const earnedPoints = 100 + survivorCount * 15;

    this.addLog(`🏆 ¡${winner.username} gana la batalla y obtiene +${earnedPoints} puntos!`);
    this.render();

    try {
      // Actualizar estadísticas en MockAPI
      await putPlayer({
        ...winner,
        points: (Number(winner.points) || 0) + earnedPoints,
        wins: (Number(winner.wins) || 0) + 1,
        matchesPlayed: (Number(winner.matchesPlayed) || 0) + 1
      }, winner.id);

      await putPlayer({
        ...loser,
        losses: (Number(loser.losses) || 0) + 1,
        matchesPlayed: (Number(loser.matchesPlayed) || 0) + 1
      }, loser.id);

      // Registrar historial de batalla
      await postBattle({
        player1: this.player1.username,
        player2: this.player2.username,
        winner: winner.username,
        pointsEarned: earnedPoints,
        date: new Date().toISOString()
      });
    } catch (err) {
      console.error('Error guardando resultados de la partida:', err);
    }
  }
}

customElements.define('battle-arena', BattleArena);