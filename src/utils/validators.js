export function isValidUsername(name) {
  return typeof name === 'string' && name.trim().length >= 3;
}

export function isValidCardData(card) {
  if (!card.name || card.name.trim().length < 2) return false;
  if (!card.type) return false;
  if (!card.hp || Number(card.hp) < 50) return false;
  if (!Array.isArray(card.attacks) || card.attacks.length < 2) return false;
  if (!card.special || !card.special.name || Number(card.special.damage) <= 0) return false;
  return true;
}