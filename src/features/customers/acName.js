// "Split AC Daikin FTKF50" (falls back to "AC")
export const acName = (a) => [a.type, a.brand, a.model].filter(Boolean).join(' ') || 'AC';
