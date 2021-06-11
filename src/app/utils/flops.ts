import { cardNotationToInt, cardSuits, cardValues } from './cardConversion';

export const getAllFlops = (deadCards: string[]) => {
  const values = Object.keys(cardValues);
  const suits = Object.keys(cardSuits);
  const cards: string[] = [];
  values.forEach(value => {
    suits.forEach(suit => {
      const card = value + suit;
      if (!deadCards.includes(card)) {
        cards.push(card);
      }
    });
  });
  const flops = [];
  for (let i = 0; i < cards.length - 1; i++) {
    for (let j = i + 1; j < cards.length; j++) {
      for (let k = j + 1; k < cards.length; k++) {
        flops.push([cards[i], cards[j], cards[k]].map(card => cardNotationToInt(card)));
      }
    }
  }
  return flops;
};
