function normalizeUsername(value, fallback = 'guest') {
  const raw = String(value ?? '').trim();
  const sanitized = raw
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

  if (sanitized) {
    return sanitized;
  }

  const fallbackRaw = String(fallback || 'guest').trim();
  const fallbackSanitized = fallbackRaw
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

  return fallbackSanitized || 'guest';
}

export { normalizeUsername };
