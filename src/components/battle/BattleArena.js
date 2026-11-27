// WEB COMPONENT (Arena de batalla 1vs1)
import { playSound } from "../../utils/SoundManager.js";
import { putPlayer } from "../../api/playersApi.js";
import { postBattle } from "../../api/battlesApi.js";
import { resolveStrikeWithRules } from "../../utils/combatRules.js";
import { AutoBattleController } from "../../utils/autoBattleController.js";

class BattleArena extends HTMLElement {
  constructor() {
    super();
    this.turn = 1; // 1 o 2
    this.logs = [];
    this.finished = false;
    this.battleMode = "manual"; // "manual" | "automatic"
    this.combatBanner = null; // { text, type }

    this.autoBattle = new AutoBattleController({
      delayMs: 900,
      onPickAction: async (action) => {
        if (this.finished || this.battleMode !== "automatic") return;
        const attacker = this.turn === 1 ? this.activeCard1 : this.activeCard2;
        const defender = this.turn === 1 ? this.activeCard2 : this.activeCard1;
        this.runAction(action, attacker, defender);
      },
      onStop: () => {
        this.syncControlsState();
      }
    });
  }

  setupBattle({ player1, player2, deck1, deck2, mode = "manual" }) {
    this.autoBattle.stop();
    this.player1 = player1;
    this.player2 = player2;
    this.battleMode = mode === "automatic" ? "automatic" : "manual";
    this.combatBanner = null;

    this.team1 = deck1.map((c) => ({
      ...c,
      maxHp: Number(c.hp) || 250,
      currentHp: Number(c.hp) || 250,
      isDefending: false,
      consecutiveDefenses: 0,
      specialCooldown: 0
    }));

    this.team2 = deck2.map((c) => ({
      ...c,
      maxHp: Number(c.hp) || 250,
      currentHp: Number(c.hp) || 250,
      isDefending: false,
      consecutiveDefenses: 0,
      specialCooldown: 0
    }));

    this.activeIdx1 = 0;
    this.activeIdx2 = 0;
    this.turn = 1;
    this.finished = false;
    this.logs = [
      `¡Comienza el combate entre ${player1.username} y ${player2.username} en modo ${this.battleMode.toUpperCase()}!`
    ];
    this.render();

    if (this.battleMode === "automatic") {
      this.autoBattle.start(() => this.getStateSnapshot());
    }
  }

  connectedCallback() {
    if (this.team1 && this.team2) {
      this.render();
      if (this.battleMode === "automatic" && !this.finished) {
        this.autoBattle.start(() => this.getStateSnapshot());
      }
    }
  }

  disconnectedCallback() {
    this.autoBattle.stop();
  }

  getStateSnapshot() {
    return {
      finished: this.finished,
      battleMode: this.battleMode,
      turn: this.turn,
      activeCard1: this.activeCard1,
      activeCard2: this.activeCard2
    };
  }

  get activeCard1() {
    return this.team1[this.activeIdx1];
  }

  get activeCard2() {
    return this.team2[this.activeIdx2];
  }

  getHpColor(current, max) {
    const pct = (current / max) * 100;
    if (pct > 50) return "var(--hp-high)";
    if (pct > 25) return "var(--hp-mid)";
    return "var(--hp-low)";
  }

  addLog(msg) {
    this.logs.unshift(msg);
  }

  setMode(nextMode) {
    if (this.finished && nextMode === "automatic") return;
    this.battleMode = nextMode === "automatic" ? "automatic" : "manual";
    this.addLog(
      this.battleMode === "automatic"
        ? "🤖 Modo AUTOMÁTICO activado: el sistema controla los turnos."
        : "🎮 Modo MANUAL activado: selecciona tus acciones."
    );
    this.render();

    if (this.battleMode === "automatic") {
      this.autoBattle.start(() => this.getStateSnapshot());
    } else {
      this.autoBattle.stop();
    }
  }

  syncControlsState() {
    const lockManual = this.finished || this.battleMode === "automatic";
    this.querySelectorAll(".btn-attack, #btn-special, #btn-defend").forEach((btn) => {
      btn.disabled = lockManual || (btn.id === "btn-special" && this.isCurrentSpecialBlocked());
    });
  }

  isCurrentSpecialBlocked() {
    const attacker = this.turn === 1 ? this.activeCard1 : this.activeCard2;
    return Number(attacker?.specialCooldown ?? 0) > 0;
  }

  render() {
    const c1 = this.activeCard1;
    const c2 = this.activeCard2;
    const attacker = this.turn === 1 ? c1 : c2;
    const activePlayerName = this.turn === 1 ? this.player1.username : this.player2.username;
    const isAuto = this.battleMode === "automatic";

    this.innerHTML = `
      <div class="container">
        <!-- Barra superior de estado + controles de modo -->
        <div class="battle-topbar">
          <div class="turn-banner">
            ${this.finished ? "🏆 ¡Combate Finalizado!" : `⚡ Turno de: ${activePlayerName}`}
          </div>

          <div class="mode-controls">
            <button
              type="button"
              id="btn-mode-manual"
              class="${!isAuto ? "btn-primary" : "btn-secondary"}"
              ${this.finished ? "disabled" : ""}
            >
              🎮 Modo Manual
            </button>
            <button
              type="button"
              id="btn-mode-auto"
              class="${isAuto ? "btn-primary" : "btn-secondary"}"
              ${this.finished ? "disabled" : ""}
            >
              🤖 Modo Automático
            </button>
            <span id="mode-indicator" class="mode-badge ${isAuto ? "is-auto" : "is-manual"}">
              ${isAuto ? "AUTOMÁTICO ACTIVO" : "MANUAL ACTIVO"}
            </span>
          </div>

          <div style="font-size: 0.9rem; color: var(--text-secondary);">
            Vivas J1: <strong>${this.team1.filter((c) => c.currentHp > 0).length}/5</strong> |
            Vivas J2: <strong>${this.team2.filter((c) => c.currentHp > 0).length}/5</strong>
          </div>
        </div>

        ${this.combatBanner ? `
          <div id="combat-event-banner" class="combat-banner ${this.combatBanner.type === "dodge" ? "is-dodge" : "is-crit"}">
            ${this.combatBanner.text}
          </div>
        ` : ""}

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
              ${isAuto
                ? "Batalla en curso en modo automático. Los controles manuales están bloqueados."
                : "Selecciona un jutsu de ataque, activa defensa (50% reducción) o cambia de shinobi."}
            </p>

            <div class="attacks-grid">
              ${(attacker.attacks || []).map((atk, idx) => `
                <button class="btn-primary btn-attack" data-idx="${idx}" ${isAuto ? "disabled" : ""}>
                  ⚔️ ${atk.name} (${atk.damage})
                </button>
              `).join("")}

              <button
                class="btn-chakra"
                id="btn-special"
                ${isAuto || attacker.specialCooldown > 0 ? "disabled" : ""}
              >
                🔥 ${attacker.special?.name || "Poder Especial"} (${attacker.special?.damage || 75})
                ${attacker.specialCooldown > 0 ? `[CD: ${attacker.specialCooldown}]` : ""}
              </button>

              <button class="btn-secondary" id="btn-defend" ${isAuto ? "disabled" : ""}>
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
          ${this.logs.map((line) => `<p>• ${line}</p>`).join("")}
        </div>
      </div>
    `;

    this.attachEvents();
  }

  renderFighterZone(player, card, team, activeIdx, playerNum) {
    const pct = Math.max(0, (card.currentHp / card.maxHp) * 100);
    const isTurn = !this.finished && this.turn === playerNum;

    return `
      <div class="fighter-zone ${isTurn ? "active-turn" : ""}">
        <div class="fighter-header">
          <span style="font-weight: 700;">${player.username}</span>
          <span class="badge-type" data-type="${card.type}">${card.type}</span>
        </div>

        <div class="fighter-visual">
          <img src="${card.image || "./public/images/cards/default.png"}" alt="${card.name}" onerror="this.src='https://placehold.co/150x150/1b1f2a/edf0f5?text=Ninja'" />
          <div style="flex: 1;">
            <h3>${card.name} ${card.isDefending ? "🛡️" : ""}</h3>
            <div class="hp-bar-bg">
              <div class="hp-bar-fill" style="width: ${pct}%; background-color: ${this.getHpColor(card.currentHp, card.maxHp)};"></div>
            </div>
            <div style="font-size: 0.85rem; font-weight: 700;">
              HP: ${card.currentHp} / ${card.maxHp}
            </div>
          </div>
        </div>

        <!-- Banca de 5 cartas (clic para relevar si es tu turno y es modo manual) -->
        <div class="bench-strip">
          ${team.map((member, idx) => `
            <div
              class="bench-pill ${idx === activeIdx ? "current" : ""} ${member.currentHp <= 0 ? "ko" : ""}"
              data-player="${playerNum}"
              data-idx="${idx}"
              title="${member.name} (${member.currentHp} HP)"
            >
              ${member.name.split(" ")[0]}<br/>${member.currentHp}HP
            </div>
          `).join("")}
        </div>
      </div>
    `;
  }

  attachEvents() {
    this.querySelector("#btn-mode-manual")?.addEventListener("click", () => {
      this.setMode("manual");
    });

    this.querySelector("#btn-mode-auto")?.addEventListener("click", () => {
      this.setMode("automatic");
    });

    if (this.finished) {
      this.querySelector("#btn-go-ranking")?.addEventListener("click", () => {
        this.dispatchEvent(new CustomEvent("navigate", {
          detail: { view: "leaderboard" },
          bubbles: true
        }));
      });
      return;
    }

    if (this.battleMode === "automatic") {
      return;
    }

    const attacker = this.turn === 1 ? this.activeCard1 : this.activeCard2;
    const defender = this.turn === 1 ? this.activeCard2 : this.activeCard1;

    // 1. Ataques normales
    this.querySelectorAll(".btn-attack").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (this.battleMode !== "manual" || this.finished) return;
        const atk = attacker.attacks[Number(btn.dataset.idx)];
        this.runAction({ type: "attack", attack: atk }, attacker, defender);
      });
    });

    // 2. Poder especial
    this.querySelector("#btn-special")?.addEventListener("click", () => {
      if (this.battleMode !== "manual" || this.finished) return;
      if (attacker.specialCooldown > 0) return;
      this.runAction(
        { type: "special", special: attacker.special },
        attacker,
        defender
      );
    });

    // 3. Defensa
    this.querySelector("#btn-defend")?.addEventListener("click", () => {
      if (this.battleMode !== "manual" || this.finished) return;
      this.runAction({ type: "defense" }, attacker, defender);
    });

    // 4. Cambio de carta activa desde la banca
    this.querySelectorAll(".bench-pill").forEach((pill) => {
      pill.addEventListener("click", () => {
        if (this.battleMode !== "manual" || this.finished) return;
        const pNum = Number(pill.dataset.player);
        const idx = Number(pill.dataset.idx);
        if (pNum !== this.turn) return;

        const team = pNum === 1 ? this.team1 : this.team2;
        const currentIdx = pNum === 1 ? this.activeIdx1 : this.activeIdx2;

        if (idx === currentIdx || team[idx].currentHp <= 0) return;

        if (pNum === 1) this.activeIdx1 = idx;
        else this.activeIdx2 = idx;

        playSound("./public/sounds/select.mp3");
        this.addLog(`Cambio táctico: entra ${team[idx].name} al combate.`);
        this.nextTurn();
      });
    });
  }

  runAction(action, attacker, defender) {
    if (!action || this.finished) return;

    if (action.type === "defense") {
      playSound("./public/sounds/defend.mp3");
      attacker.isDefending = true;
      attacker.consecutiveDefenses = (attacker.consecutiveDefenses ?? 0) + 1;
      this.combatBanner = null;
      this.addLog(`${attacker.name} adopta postura defensiva (daño reducido al 50%).`);
      this.nextTurn();
      return;
    }

    attacker.consecutiveDefenses = 0;

    if (action.type === "special") {
      if (attacker.specialCooldown > 0) return;
      playSound("./public/sounds/special.mp3");
      attacker.specialCooldown = attacker.special?.cooldown || 2;
      this.executeStrike(
        attacker,
        defender,
        action.special?.name || "Poder Especial",
        action.special?.damage || 75,
        true
      );
      return;
    }

    const atk = action.attack;
    playSound("./public/sounds/attack.mp3");
    this.executeStrike(attacker, defender, atk.name, atk.damage, false);
  }

  executeStrike(attacker, defender, moveName, baseDamage, isSpecial) {
    // Limpiar defensa propia al atacar
    attacker.isDefending = false;

    const outcome = resolveStrikeWithRules({
      attacker,
      defender,
      moveName,
      baseDamage,
      isSpecial
    });

    // Consumir postura defensiva del rival tras recibir el impacto
    defender.isDefending = false;
    defender.currentHp = outcome.nextHp;

    this.combatBanner = outcome.bannerText
      ? { text: outcome.bannerText, type: outcome.eventType }
      : null;

    if (outcome.dodged) {
      playSound("./public/sounds/select.mp3");
    } else if (outcome.isCritical) {
      playSound("./public/sounds/special.mp3");
    }

    this.addLog(outcome.logText);

    // 11. Verificar si la carta defensora fue derrotada
    if (defender.currentHp === 0) {
      playSound("./public/sounds/ko.mp3");
      this.addLog(`💥 ¡${defender.name} ha quedado fuera de combate!`);

      const defenderTeam = this.turn === 1 ? this.team2 : this.team1;
      const nextAliveIdx = defenderTeam.findIndex((c) => c.currentHp > 0);

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
    const currentCard = this.turn === 1 ? this.activeCard1 : this.activeCard2;
    if (currentCard.specialCooldown > 0) {
      currentCard.specialCooldown -= 1;
    }

    this.turn = this.turn === 1 ? 2 : 1;
    this.render();
  }

  async finishMatch() {
    this.finished = true;
    this.autoBattle.stop(); // Detiene cualquier temporizador pendiente
    playSound("./public/sounds/victory.mp3");

    const winner = this.turn === 1 ? this.player1 : this.player2;
    const loser = this.turn === 1 ? this.player2 : this.player1;
    const survivorCount = (this.turn === 1 ? this.team1 : this.team2).filter((c) => c.currentHp > 0).length;
    const earnedPoints = 100 + survivorCount * 15;

    this.addLog(`🏆 ¡${winner.username} gana la batalla y obtiene +${earnedPoints} puntos!`);
    this.render();

    try {
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

      await postBattle({
        player1: this.player1.username,
        player2: this.player2.username,
        winner: winner.username,
        pointsEarned: earnedPoints,
        mode: this.battleMode, // "automatic" | "manual"
        date: new Date().toISOString()
      });
    } catch (err) {
      console.error("Error guardando resultados de la partida:", err);
    }
  }
}

customElements.define("battle-arena", BattleArena);