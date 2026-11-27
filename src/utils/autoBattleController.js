import { isSpecialReady } from "./combatRules.js";

export class AutoBattleController {
  constructor({ delayMs = 900, onPickAction, onStop }) {
    this.delayMs = delayMs;
    this.onPickAction = onPickAction;
    this.onStop = onStop;

    this.running = false;
    this.busy = false;
    this.timeoutId = null;
    this.abortWait = null;
  }

  getAvailableActions(card) {
    if (!card) return [];
    const actions = [];

    (card.attacks || []).forEach((atk, index) => {
      actions.push({
        type: "attack",
        index,
        attack: atk
      });
    });

    actions.push({ type: "defense" });

    if (isSpecialReady(card)) {
      actions.push({
        type: "special",
        special: card.special
      });
    }

    return actions;
  }

  selectAction(card) {
    const validActions = this.getAvailableActions(card);
    if (!validActions.length) return null;

    const consecutiveDefenses = Number(card.consecutiveDefenses ?? 0);
    let pool = validActions;

    // Evitar defenderse demasiadas veces seguidas
    if (consecutiveDefenses >= 2) {
      const nonDefense = pool.filter((a) => a.type !== "defense");
      if (nonDefense.length > 0) pool = nonDefense;
    }

    // Priorizar poder especial cuando esté disponible
    const special = pool.find((a) => a.type === "special");
    if (special && Math.random() < 0.75) {
      return special;
    }

    // Mayor probabilidad de defenderse si la vida está baja (< 35%)
    const hpRatio = Number(card.currentHp ?? 0) / Math.max(1, Number(card.maxHp ?? 250));
    const defense = pool.find((a) => a.type === "defense");
    if (hpRatio < 0.35 && defense && Math.random() < 0.5) {
      return defense;
    }

    return pool[Math.floor(Math.random() * pool.length)];
  }

  wait(ms) {
    this.clearTimer();
    return new Promise((resolve, reject) => {
      this.abortWait = () => {
        this.timeoutId = null;
        this.abortWait = null;
        reject(new Error("AUTO_STOPPED"));
      };

      this.timeoutId = window.setTimeout(() => {
        this.timeoutId = null;
        this.abortWait = null;
        resolve();
      }, ms);
    });
  }

  clearTimer() {
    if (this.timeoutId !== null) {
      window.clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    if (typeof this.abortWait === "function") {
      const rejectFn = this.abortWait;
      this.abortWait = null;
      rejectFn(new Error("AUTO_STOPPED"));
    }
  }

  async start(getState) {
    if (this.running) return;
    this.running = true;

    try {
      while (this.running) {
        const snap = getState();
        if (!snap || snap.finished || snap.battleMode !== "automatic") {
          break;
        }

        if (this.busy) {
          await this.wait(150);
          continue;
        }

        await this.wait(this.delayMs);
        if (!this.running) break;

        const current = getState();
        if (!current || current.finished || current.battleMode !== "automatic") {
          break;
        }
//hola
        this.busy = true;
        try {
          const activeCard = current.turn === 1 ? current.activeCard1 : current.activeCard2;
          const action = this.selectAction(activeCard);
          if (action && typeof this.onPickAction === "function") {
            await this.onPickAction(action, current.turn);
          }
        } finally {
          this.busy = false;
        }
      }
    } catch (err) {
      if (err?.message !== "AUTO_STOPPED") {
        throw err;
      }
    } finally {
      this.running = false;
      this.busy = false;
      this.clearTimer();
      if (typeof this.onStop === "function") {
        this.onStop();
      }
    }
  }

  stop() {
    this.running = false;
    this.clearTimer();
  }
}