export function createScanConfirmation() {
  let activeCode = '';
  let lastCode = '';
  let lastReleasedAt = 0;
  const repeatCooldownMs = 1200;

  return {
    reset() {
      activeCode = '';
      lastCode = '';
      lastReleasedAt = 0;
    },
    release(now = Date.now()) {
      if (!activeCode) return;
      lastCode = activeCode;
      lastReleasedAt = now;
      activeCode = '';
    },
    accept(value: string, now = Date.now()) {
      const code = value.trim();
      if (!code || activeCode) return false;
      if (code === lastCode && now - lastReleasedAt < repeatCooldownMs) return false;
      activeCode = code;
      return true;
    },
  };
}
