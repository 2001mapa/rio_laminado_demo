export function createScanConfirmation() {
  let candidate = '';
  let firstSeenAt = 0;
  let lastSeenAt = 0;

  return {
    reset() {
      candidate = '';
      firstSeenAt = 0;
      lastSeenAt = 0;
    },
    accept(value: string, now = Date.now()) {
      const code = value.trim();
      if (!code) return false;
      if (code !== candidate || now - lastSeenAt > 500) {
        candidate = code;
        firstSeenAt = now;
        lastSeenAt = now;
        return false;
      }
      lastSeenAt = now;
      if (now - firstSeenAt < 300) return false;
      this.reset();
      return true;
    },
  };
}
