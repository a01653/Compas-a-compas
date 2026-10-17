/**
 * Las fuentes de las hojas se declaran con subconjuntos `unicode-range`: el navegador solo descarga un
 * subconjunto cuando se dibuja un texto que lo necesita, y `document.fonts.ready` no espera a fuentes que
 * aún no se han pedido. Por eso se piden explícitamente con el texto real de la canción antes de medir.
 */

/** Caracteres distintos que aparecen en la canción (basta para cubrir los subconjuntos necesarios). */
export function songSample(song) {
  const parts = ['Aa0123456789/×', String(song.title || ''), String(song.key || ''), 'Compás continuación'];
  for (const measure of song.measures || []) {
    parts.push(String(measure.label || ''));
    for (const event of measure.chordEvents || []) {
      parts.push(String(event.chordName || ''), String(event.aboveText || ''), String(event.insideText || ''));
      for (const voicing of event.voicings || []) {
        parts.push(String(voicing.aboveText || ''), String(voicing.insideText || ''), String(voicing.voicingDegree || ''),
          String(voicing.tonality?.text || ''));
        for (const degree of voicing.degrees || []) parts.push(String(degree || ''));
      }
    }
  }
  return [...new Set(parts.join(''))].join('');
}

export async function ensureFonts(sample, doc = document) {
  const fonts = doc.fonts;
  if (!fonts) return;
  try {
    await Promise.all([
      fonts.load('21px "Caveat Brush"', sample),
      fonts.load('15px "Gochi Hand"', sample),
    ]);
  } catch {
    // Si una fuente no carga se mide con la alternativa; no hay otra cosa que hacer.
  }
  await fonts.ready;
}
