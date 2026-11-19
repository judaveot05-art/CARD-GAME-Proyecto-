// GESTOR DE AUDIO 
export function playSound(soundPath) {
  if (!soundPath) return;
  try {
    const audio = new Audio(soundPath);
    audio.volume = 0.5;
    audio.play().catch(() => {
      // Silencia bloqueos de autoplay del navegador
    });
  } catch (error) {
    console.warn('No se pudo reproducir el audio:', soundPath);
  }
}