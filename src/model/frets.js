/**
 * Entrada textual de digitación, orden sexta → primera. x/X = muda (null), 0 = al aire.
 * Una letra de a a o vale un traste de 10 a 24, para escribir seguido `xa9axa` (x 10 9 10 x 10).
 */

const LETTERS = 'abcdefghijklmno';

export function formatFrets(frets) {
  return frets.map((f) => (f === null ? 'x' : String(f))).join(' ');
}

/**
 * Devuelve { frets } o { error }. No modifica nada: quien llama decide si aplicar.
 * Sin separadores se exigen exactamente seis caracteres; con más se piden separadores o letras.
 */
export function parseFrets(text) {
  const raw = String(text).trim();
  if (!raw) return { error: 'Escribe seis valores: traste, 0 (al aire) o x (muda).' };

  const hasSeparators = /[\s,;]/.test(raw);
  const tokens = hasSeparators ? raw.split(/[\s,;]+/).filter(Boolean) : [...raw];

  if (!hasSeparators && tokens.length > 6) {
    return { error: 'Más de seis caracteres seguidos son ambiguos. Separa los trastes con espacios (x 10 12 10 11 10) o escribe los de dos cifras con letras, a = 10 (xacaba).' };
  }
  if (tokens.length !== 6) {
    return { error: `Se necesitan 6 valores (sexta a primera) y hay ${tokens.length}.` };
  }

  const frets = [];
  for (const token of tokens) {
    if (/^[xX]$/.test(token)) frets.push(null);
    else if (/^\d{1,2}$/.test(token)) frets.push(Number(token));
    else if (/^[a-o]$/i.test(token)) frets.push(10 + LETTERS.indexOf(token.toLowerCase()));
    else return { error: `«${token}» no es válido: usa un número entero, 0, x o una letra de a (10) a o (24).` };
  }
  return { frets };
}
