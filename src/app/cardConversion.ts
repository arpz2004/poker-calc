export const cardNotationToInt = (notation: string): number => {
  let cardValue = 0;

  if (notation.length === 2) {
    cardValue = cardValues[notation[0] as keyof typeof cardValues] + 13 * cardSuits[notation[1] as keyof typeof cardSuits];
  } else if (notation.length === 1) {
    cardValue = cardValues[notation[0] as keyof typeof cardValues] + 13 * Math.floor(Math.random() * 4);
  }
  return cardValue;
};

export const cardValues = {
  2: 0,
  3: 1,
  4: 2,
  5: 3,
  6: 4,
  7: 5,
  8: 6,
  9: 7,
  T: 8,
  J: 9,
  Q: 10,
  K: 11,
  A: 12
};

export const cardSuits = { c: 0, d: 1, h: 2, s: 3 };
