import { cardNotationToInt } from '../../../src/app/utils/cardConversion';
import * as bindings from 'bindings';
const binding = bindings('native');
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
        communityCards: [1, 2, 3, 4, 5],
        playerCards: [6, 7],
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
        communityCards: [1, 2, 3, 4, 5],
        playerCards: [6, 7],
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
        communityCards: [1, 2, 3, 4, 5],
        playerCards: [6, 7],
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
        communityCards: [1, 2, 3, 4, 5],
        playerCards: [6, 7],
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
        communityCards: cnToInt(['2c', '2d', '2h', '2s', '3c']),
        playerCards: cnToInt(['3d', '3h']),
        dealerCards: cnToInt(['3s', '4c']),
        profit: -6,
        equity: -6
      });
  });
});


describe('Basic strategy', () => {
  describe('Preflop 4x', () => {
    it('should give 5 profit AA 4x preflop win, dealer qualifies, no blind pay', () => {
      expect(binding.runUthSimulations(
        cnToInt(['9c', 'Th', '2c', '9d', 'Kc', 'Ac', 'Ad', '4c', '4d'])
      ))
        .toEqual({
          communityCards: cnToInt(['9c', 'Th', '2c', '9d', 'Kc']),
          playerCards: cnToInt(['Ac', 'Ad']),
          dealerCards: cnToInt(['4c', '4d']),
          profit: 5,
          equity: 5
        });
    });

    it('should give 6.5 profit A2s+ 4x preflop win, dealer qualifies, flush blind pay', () => {
      expect(binding.runUthSimulations(
        cnToInt(['Jc', 'Ad', '8s', 'Tc', '7c', 'Ac', '2c', '9h', '4c'])
      ))
        .toEqual({
          communityCards: cnToInt(['Jc', 'Ad', '8s', 'Tc', '7c']),
          playerCards: cnToInt(['Ac', '2c']),
          dealerCards: cnToInt(['9h', '4c']),
          profit: 6.5,
          equity: 6.5
        });
    });

    it('should give 5 profit A2o+ 4x preflop win, dealer qualifies, no blind pay', () => {
      expect(binding.runUthSimulations(
        cnToInt(['Jc', 'Ad', '8s', 'Tc', '7c', 'Ac', '2h', 'Jh', '4c'])
      ))
        .toEqual({
          communityCards: cnToInt(['Jc', 'Ad', '8s', 'Tc', '7c']),
          playerCards: cnToInt(['Ac', '2h']),
          dealerCards: cnToInt(['Jh', '4c']),
          profit: 5,
          equity: 5
        });
    });

    it('should give 5 profit KK 4x preflop win, dealer qualifies, no blind pay', () => {
      expect(binding.runUthSimulations(
        cnToInt(['6c', '9h', '2c', '6h', '7s', 'Kd', 'Ks', 'Qc', '5s'])
      ))
        .toEqual({
          communityCards: cnToInt(['6c', '9h', '2c', '6h', '7s']),
          playerCards: cnToInt(['Kd', 'Ks']),
          dealerCards: cnToInt(['Qc', '5s']),
          profit: 5,
          equity: 5
        });
    });

    it('should give -6 profit K5o+ 4x preflop loss, dealer qualifies, no blind pay', () => {
      expect(binding.runUthSimulations(
        cnToInt(['2d', 'Ac', '2s', '6c', '7d', 'Kc', '5h', '3d', '3h'])
      ))
        .toEqual({
          communityCards: cnToInt(['2d', 'Ac', '2s', '6c', '7d']),
          playerCards: cnToInt(['Kc', '5h']),
          dealerCards: cnToInt(['3d', '3h']),
          profit: -6,
          equity: -6
        });
    });

    it('should give 5 profit K2s+ 4x preflop win, dealer qualifies, no blind pay', () => {
      expect(binding.runUthSimulations(
        cnToInt(['7h', '2h', 'Td', '5c', '7d', 'Kc', '2c', 'Jc', '4c'])
      ))
        .toEqual({
          communityCards: cnToInt(['7h', '2h', 'Td', '5c', '7d']),
          playerCards: cnToInt(['Kc', '2c']),
          dealerCards: cnToInt(['Jc', '4c']),
          profit: 5,
          equity: 5
        });
    });

    it('should give 4 profit QQ 4x preflop win, dealer doesnt qualify, no blind pay', () => {
      expect(binding.runUthSimulations(
        cnToInt(['7c', 'Ac', '2d', 'Kh', '4d', 'Qh', 'Qs', '3h', '6d'])
      ))
        .toEqual({
          communityCards: cnToInt(['7c', 'Ac', '2d', 'Kh', '4d']),
          playerCards: cnToInt(['Qh', 'Qs']),
          dealerCards: cnToInt(['3h', '6d']),
          profit: 4,
          equity: 4
        });
    });

    it('should give -5 profit Q8o+ 4x preflop loss, dealer qualifies, no blind pay', () => {
      expect(binding.runUthSimulations(
        cnToInt(['5h', 'Jc', 'Td', '5s', 'Kc', 'Qh', '8c', 'Ts', '4d'])
      ))
        .toEqual({
          communityCards: cnToInt(['5h', 'Jc', 'Td', '5s', 'Kc']),
          playerCards: cnToInt(['Qh', '8c']),
          dealerCards: cnToInt(['Ts', '4d']),
          profit: -6,
          equity: -6
        });
    });

    it('should give 4 profit Q6s+ 4x preflop win, dealer doesnt qualify, no blind pay', () => {
      expect(binding.runUthSimulations(
        cnToInt(['6c', '5s', '3h', 'Qd', 'Tc', 'Qh', '6h', '4c', 'Ac'])
      ))
        .toEqual({
          communityCards: cnToInt(['6c', '5s', '3h', 'Qd', 'Tc']),
          playerCards: cnToInt(['Qh', '6h']),
          dealerCards: cnToInt(['4c', 'Ac']),
          profit: 4,
          equity: 4
        });
    });

    it('should give 4 profit JJ 4x preflop win, dealer doesnt qualify, no blind pay', () => {
      expect(binding.runUthSimulations(
        cnToInt(['Js', '3s', '2h', '8s', 'Kh', 'Jh', 'Jc', 'Ac', '5d'])
      ))
        .toEqual({
          communityCards: cnToInt(['Js', '3s', '2h', '8s', 'Kh']),
          playerCards: cnToInt(['Jh', 'Jc']),
          dealerCards: cnToInt(['Ac', '5d']),
          profit: 4,
          equity: 4
        });
    });

    it('should give -5 profit JTo 4x preflop loss, dealer doesnt qualify, no blind pay', () => {
      expect(binding.runUthSimulations(
        cnToInt(['4d', '2h', '9d', 'Kd', '3c', 'Jh', 'Tc', 'Ac', 'Qs'])
      ))
        .toEqual({
          communityCards: cnToInt(['4d', '2h', '9d', 'Kd', '3c']),
          playerCards: cnToInt(['Jh', 'Tc']),
          dealerCards: cnToInt(['Ac', 'Qs']),
          profit: -5,
          equity: -5
        });
    });

    it('should give -5 profit J8s+ 4x preflop loss, dealer qualifies, no blind pay', () => {
      expect(binding.runUthSimulations(
        cnToInt(['7s', 'Ad', '5c', 'Kc', '9h', 'Jd', '8d', '9d', '2h'])
      ))
        .toEqual({
          communityCards: cnToInt(['7s', 'Ad', '5c', 'Kc', '9h']),
          playerCards: cnToInt(['Jd', '8d']),
          dealerCards: cnToInt(['9d', '2h']),
          profit: -6,
          equity: -6
        });
    });

    it('should give 4 profit 33+ 4x preflop win, dealer doesnt qualify, no blind pay', () => {
      expect(binding.runUthSimulations(
        cnToInt(['6s', '7s', 'Tc', '5d', 'Jc', '3s', '3d', 'Ks', 'Qs'])
      ))
        .toEqual({
          communityCards: cnToInt(['6s', '7s', 'Tc', '5d', 'Jc']),
          playerCards: cnToInt(['3s', '3d']),
          dealerCards: cnToInt(['Ks', 'Qs']),
          profit: 4,
          equity: 4
        });
    });
  });
});