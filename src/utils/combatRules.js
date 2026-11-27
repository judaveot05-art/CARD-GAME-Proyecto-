import { calculateDamage } from "./battleEngine.js";

export const COMBAT_RULES = {
  dodgeChance: 0.08,     // 8%
  critChance: 0.12,      // 12%
  critMultiplier: 1.5,   // x1.5
  defenseReduction: 0.5  // 50%
};

export function isSpecialReady(card) {
  if (!card || !card.special) return false;
  const unlocked = card.specialUnlocked !== undefined ? Boolean(card.specialUnlocked) : true;
  const cooldown = Number(card.specialCooldown ?? 0);
  return unlocked && cooldown === 0;
}

/**
 * Resuelve un ataque siguiendo el orden obligatorio de 11 pasos:
 * 1. Seleccionar ataque (recibido en moveName / baseDamage)
 * 2. Calcular factor aleatorio de daño (delegado a calculateDamage del motor base)
 * 3. Determinar si el defensor esquiva (8%)
 * 4. Si esquiva: daño final = 0 y termina resolución del daño
 * 5. Si NO esquiva: determinar golpe crítico (12%)
 * 6. Si es crítico: daño * 1.5
 * 7. Si el defensor estaba defendiendo: aplicar reducción del 50%
 * 8. Redondear daño final
 * 9. Restar HP (nunca por debajo de 0)
 * 10 y 11. Actualizar interfaz y verificar derrota (en BattleArena)
 */
export function resolveStrikeWithRules({
  attacker,
  defender,
  moveName,
  baseDamage,
  isSpecial = false
}) {
  // 1 y 2. Selección de ataque + factor aleatorio de daño en calculateDamage
  const baseResult = calculateDamage(
    baseDamage,
    attacker.type,
    defender.type,
    false // La defensa se aplica en el paso 7 tras crítico
  );

  let damage = Number(baseResult?.finalDamage ?? baseDamage ?? 0);
  const notes = [];
  if (baseResult?.note) notes.push(baseResult.note);

  // 3. Determinar si el defensor esquiva (8%)
  const dodged = Math.random() < COMBAT_RULES.dodgeChance;

  // 4. Si esquiva: daño final = 0 y termina la resolución del daño
  if (dodged) {
    return {
      dodged: true,
      isCritical: false,
      isSpecial,
      finalDamage: 0,
      nextHp: Math.max(0, Number(defender.currentHp ?? 0)),
      bannerText: "¡ATAQUE ESQUIVADO!",
      eventType: "dodge",
      logText: `${defender.name} esquivó ${moveName} de ${attacker.name} (0 de daño).`
    };
  }

  // 5. Si NO esquiva: determinar golpe crítico (12%)
  const isCritical = Math.random() < COMBAT_RULES.critChance;

  // 6. Si es crítico: daño * 1.5
  if (isCritical) {
    damage *= COMBAT_RULES.critMultiplier;
    notes.push("¡GOLPE CRÍTICO! (x1.5)");
  }

  // 7. Si el defensor estaba defendiendo: aplicar reducción del 50%
  const wasDefending = Boolean(defender.isDefending);
  if (wasDefending) {
    damage *= (1 - COMBAT_RULES.defenseReduction);
    notes.push("Defensa activa (-50%)");
  }

  // 8. Redondear daño final
  const finalDamage = Math.max(0, Math.round(damage));

  // 9. Restar HP (nunca por debajo de 0)
  const currentHp = Math.max(0, Number(defender.currentHp ?? 0));
  const nextHp = Math.max(0, currentHp - finalDamage);

  const bannerText = isCritical ? "¡GOLPE CRÍTICO!" : null;
  const eventType = isCritical ? "crit" : "normal";
  const extraNote = notes.length ? ` [${notes.join(" | ")}]` : "";

  return {
    dodged: false,
    isCritical,
    isSpecial,
    wasDefending,
    finalDamage,
    nextHp,
    bannerText,
    eventType,
    logText: `${attacker.name} usa ${moveName} contra ${defender.name} y causa ${finalDamage} de daño.${extraNote}`
  };
}