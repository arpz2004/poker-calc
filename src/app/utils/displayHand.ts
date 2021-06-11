
const NUM_SUITS_IN_DECK = 4;
export const CARD_VALUES = '23456789TJQKA';

export const handDisplay = (hand: number[]) => {
  const values = CARD_VALUES;
  const suits = [`♣︎`, `♦︎`, `♥︎`, `♠︎`];
  const handString = hand
    .reduce((obj: string[], item) => {
      obj.push(
        `${values[Math.floor((item - 1) / NUM_SUITS_IN_DECK)]}${suits[((item - 1) % NUM_SUITS_IN_DECK)]
        }`
      );
      return obj;
    }, [])
    .join(' ');
  return handString;
};
