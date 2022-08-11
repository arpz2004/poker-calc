import { cardNotationToInt } from "../../../src/app/utils/cardConversion";
const binding = require("bindings")("native");
const cnToInt = (cards: string[]) => cards.map(card => cardNotationToInt(card));

describe('Base scenarios', () => {
  it('should distribute 5 community cards then 2 player cards then 2 dealer cards from 52 card deck', () => {
    expect(binding.runUthSimulations(
      [1, 2, 3, 4, 5, 6, 7, 8,
        9, 10, 11, 12, 13, 14, 15,
        16, 17, 18, 19, 20, 21, 22,
        23, 24, 25, 26, 27, 28, 29,
        30, 31, 32, 33, 34, 35, 36,
        37, 38, 39, 40, 41, 42, 43,
        44, 45, 46, 47, 48, 49, 50,
        51, 52]))
      .toEqual({
        playerCards: [6, 7],
        communityCards: [1, 2, 3, 4, 5],
        dealerCards: [8, 9],
        profit: -6,
        equity: -6
      });
  });

  it('should distribute 5 community cards then 2 player cards then 2 dealer cards from 9 card deck', () => {
    expect(binding.runUthSimulations(
      [1, 2, 3, 4, 5, 6, 7, 8, 9]
    ))
      .toEqual({
        playerCards: [6, 7],
        communityCards: [1, 2, 3, 4, 5],
        dealerCards: [8, 9],
        profit: -6,
        equity: -6
      });
  });

  it('should give a different result if one card changed', () => {
    expect(binding.runUthSimulations(
      [10, 2, 3, 4, 5, 6, 7, 8, 9]
    ))
      .not.toEqual({
        playerCards: [6, 7],
        communityCards: [1, 2, 3, 4, 5],
        dealerCards: [8, 9],
        profit: -6,
        equity: -6
      });
  });

  it('should give same result using cardNotationToInt passed to runIthSimulations', () => {
    expect(binding.runUthSimulations(
      cnToInt(['2c', '2d', '2h', '2s', '3c', '3d', '3h', '3s', '4c'])
    ))
      .toEqual({
        playerCards: [6, 7],
        communityCards: [1, 2, 3, 4, 5],
        dealerCards: [8, 9],
        profit: -6,
        equity: -6
      });
  });

  it('should give same result using cardNotationToInt everywhere', () => {
    expect(binding.runUthSimulations(
      cnToInt(['2c', '2d', '2h', '2s', '3c', '3d', '3h', '3s', '4c'])
    ))
      .toEqual({
        playerCards: cnToInt(['3d', '3h']),
        communityCards: cnToInt(['2c', '2d', '2h', '2s', '3c']),
        dealerCards: cnToInt(['3s', '4c']),
        profit: -6,
        equity: -6
      });
  });
});


describe('Basic strategy', () => {
  describe('Preflop 4x', () => {
    it('should give 5 profit AcAd vs 4c4d on 9cTh2c9dKc 4x preflop win, dealer qualifies, no blind pay', () => {
      expect(binding.runUthSimulations(
        cnToInt(['9c', 'Th', '2c', '9d', 'Kc', 'Ac', 'Ad', '4c', '4d'])
      ))
        .toEqual({
          playerCards: cnToInt(['Ac', 'Ad']),
          communityCards: cnToInt(['9c', 'Th', '2c', '9d', 'Kc']),
          dealerCards: cnToInt(['4c', '4d']),
          profit: 5,
          equity: 5
        });
    });

    it('should give 6.5 profit Ac2c vs 9h4c on JcAd8sTc7c 4x preflop win, dealer qualifies, flush blind pay', () => {
      expect(binding.runUthSimulations(
        cnToInt(['Jc', 'Ad', '8s', 'Tc', '7c', 'Ac', '2c', '9h', '4c'])
      ))
        .toEqual({
          playerCards: cnToInt(['Ac', '2c']),
          communityCards: cnToInt(['Jc', 'Ad', '8s', 'Tc', '7c']),
          dealerCards: cnToInt(['9h', '4c']),
          profit: 6.5,
          equity: 6.5
        });
    });
  });
});