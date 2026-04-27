export function parseAmount(input: string): number {
  if (!input) return 0;
  const clean = input.toLowerCase().replace(/,/g, '').trim();
  const match = clean.match(/^([\d.]+)([kmb]?)$/);
  
  if (!match) return 0;
  
  const value = parseFloat(match[1]);
  const unit = match[2];
  
  switch (unit) {
    case 'k': return value * 1_000;
    case 'm': return value * 1_000_000;
    case 'b': return value * 1_000_000_000;
    default: return value;
  }
}

export function formatCompact(num: number): string {
  if (num >= 1_000_000_000) return (num / 1_000_000_000).toFixed(1).replace(/\.0$/, '') + 'B';
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (num >= 1_000) return (num / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
  return num.toString();
}
