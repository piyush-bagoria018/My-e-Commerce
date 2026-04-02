const PREFERRED_PATTERNS = [
  /(^|[^a-z])front([^a-z]|$)/,
  /(^|[^a-z])main([^a-z]|$)/,
  /(^|[^a-z])primary([^a-z]|$)/,
  /(^|[^a-z])hero([^a-z]|$)/,
  /(^|[^a-z])default([^a-z]|$)/,
  /(^|[^a-z])angle\s*1([^a-z]|$)/,
  /(^|[^a-z_])1([^a-z_]|$)/,
];

const DEPRIORITIZE_PATTERNS = [
  /(^|[^a-z])back([^a-z]|$)/,
  /(^|[^a-z])rear([^a-z]|$)/,
  /(^|[^a-z])side([^a-z]|$)/,
  /(^|[^a-z])zoom([^a-z]|$)/,
  /(^|[^a-z])detail([^a-z]|$)/,
  /(^|[^a-z])closeup([^a-z]|$)/,
  /(^|[^a-z])spec([^a-z]|$)/,
  /(^|[^a-z])feature([^a-z]|$)/,
  /(^|[^a-z])chart([^a-z]|$)/,
  /(^|[^a-z])size([^a-z]|$)/,
  /(^|[^a-z])dimension([^a-z]|$)/,
  /(^|[^a-z])certificate([^a-z]|$)/,
  /(^|[^a-z])label([^a-z]|$)/,
  /(^|[^a-z])packaging([^a-z]|$)/,
  /(^|[^a-z])box([^a-z]|$)/,
  /(^|[^a-z])banner([^a-z]|$)/,
  /(^|[^a-z])poster([^a-z]|$)/,
  /(^|[^a-z])ad([^a-z]|$)/,
];

function normalizeText(url: string) {
  try {
    return decodeURIComponent(url).toLowerCase();
  } catch {
    return url.toLowerCase();
  }
}

function scoreImage(url: string, index: number) {
  const text = normalizeText(url);
  let score = 0;

  if (index === 0) {
    // Small preference for existing order to avoid surprising changes when names are ambiguous.
    score += 5;
  }

  for (const pattern of PREFERRED_PATTERNS) {
    if (pattern.test(text)) score += 20;
  }

  for (const pattern of DEPRIORITIZE_PATTERNS) {
    if (pattern.test(text)) score -= 25;
  }

  return score;
}

export function getPrimaryProductImage(productImages?: string[]) {
  if (!productImages || productImages.length === 0) return undefined;
  if (productImages.length === 1) return productImages[0];

  let bestIndex = 0;
  let bestScore = scoreImage(productImages[0], 0);

  for (let i = 1; i < productImages.length; i += 1) {
    const currentScore = scoreImage(productImages[i], i);
    if (currentScore > bestScore) {
      bestScore = currentScore;
      bestIndex = i;
    }
  }

  return productImages[bestIndex];
}
