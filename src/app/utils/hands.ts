import { cardSuits, cardValues } from './cardConversion';

export const getAllHands = () => {
  const values = Object.keys(cardValues);
  const suits = Object.keys(cardSuits);
  const cards: string[] = [];
  values.forEach(value => {
    suits.forEach(suit => {
      const card = value + suit;
      cards.push(card);
    });
  });
  const flops = [];
  for (let i = 0; i < cards.length - 1; i++) {
    for (let j = i + 1; j < cards.length; j++) {
      flops.push([cards[i], cards[j]]);
    }
  }
  return flops;
};
