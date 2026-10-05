// Regla única de contraseña para cuentas creadas/restablecidas por el administrador.
// La importan tanto la UI como las Server Actions para que nunca diverjan.
export const PASSWORD_MIN_LENGTH = 8;

export const PASSWORD_RULE_MESSAGE =
  'La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número.';

export function validatePassword(password: unknown): string | null {
  if (typeof password !== 'string' || password.length === 0) {
    return 'La contraseña es obligatoria.';
  }
  if (
    password.length < PASSWORD_MIN_LENGTH ||
    !/[a-z]/.test(password) ||
    !/[A-Z]/.test(password) ||
    !/\d/.test(password)
  ) {
    return PASSWORD_RULE_MESSAGE;
  }
  return null;
}

// Traduce errores de Supabase Auth relacionados con la política de contraseñas
// (que puede ser más estricta que la nuestra) a un mensaje claro.
export function describeAuthPasswordError(error: { message?: string; code?: string } | null | undefined): string | null {
  if (!error) return null;
  const msg = (error.message || '').toLowerCase();
  if (error.code === 'weak_password' || msg.includes('password')) {
    return `Supabase rechazó la contraseña por su política de seguridad (más estricta que la mínima del sistema): ${error.message}. Elige una clave más robusta.`;
  }
  return null;
}

// Generador opcional para el botón «Generar». Usa crypto.getRandomValues y
// garantiza mayúscula, minúscula y número. Solo se ejecuta en el navegador.
export function generatePassword(length = 14): string {
  const lower = 'abcdefghijkmnpqrstuvwxyz';
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const digits = '23456789';
  const all = lower + upper + digits;
  const rand = (n: number) => {
    const buf = new Uint32Array(1);
    globalThis.crypto.getRandomValues(buf);
    return buf[0] % n;
  };
  const chars = [lower[rand(lower.length)], upper[rand(upper.length)], digits[rand(digits.length)]];
  while (chars.length < length) chars.push(all[rand(all.length)]);
  for (let i = chars.length - 1; i > 0; i--) {
    const j = rand(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join('');
}
