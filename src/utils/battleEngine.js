// MOTOR DE CALCULO DE COMBATE
// Tabla de ventajas elementales de Naruto (Atacante -> Defensor debil)
const ELEMENT_ADVANTAGES = {
  Fuego: 'Viento',
  Viento: 'Rayo',
  Rayo: 'Tierra',
  Tierra: 'Agua',
  Agua: 'Fuego'
};

/**
 * Calcula el daño final de un ataque o poder especial
 * @param {number} baseDamage - Daño base del jutsu seleccionado
 * @param {string} attackerType - Naturaleza de chakra del atacante
 * @param {string} defenderType - Naturaleza de chakra del defensor
 * @param {boolean} isDefending - Si el defensor activo postura defensiva
 * @returns {object} { finalDamage, multiplierText }
 */
export function calculateDamage(baseDamage, attackerType, defenderType, isDefending = false) {
  let damage = Number(baseDamage) || 0;
  let notes = [];

  // 1. Verificar ventaja elemental (+25% de daño)
  if (ELEMENT_ADVANTAGES[attackerType] === defenderType) {
    damage = Math.round(damage * 1.25);
    notes.push('¡Ventaja elemental +25%!');
  }

  // 2. Verificar postura defensiva del rival (reduce 50% del daño)
  if (isDefending) {
    damage = Math.round(damage * 0.5);
    notes.push('Defensa activa (-50% daño)');
  }

  return {
    finalDamage: Math.max(1, damage),
    note: notes.join(' | ')
  };
}