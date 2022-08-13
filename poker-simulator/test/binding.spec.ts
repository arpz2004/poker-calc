import { cardNotationToInt } from '../../src/app/utils/cardConversion';
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
        edge: -6
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
        edge: -6
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
        edge: -6
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
        edge: -6
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
        edge: -6
      });
  });
});

describe('Blind payouts', () => {
  it('should give 500:1 on Royal Flush', () => {
    expect(binding.runUthSimulations(
      cnToInt(['Qs', '6h', 'Ts', '4d', 'Js', 'As', 'Ks', '9s', '8s'])
    ))
      .toEqual({
        communityCards: cnToInt(['Qs', '6h', 'Ts', '4d', 'Js']),
        playerCards: cnToInt(['As', 'Ks']),
        dealerCards: cnToInt(['9s', '8s']),
        profit: 505,
        edge: 505
      });
  });

  it('should give 50:1 on Straight Flush', () => {
    expect(binding.runUthSimulations(
      cnToInt(['9s', '6h', 'Ts', '4d', 'Js', 'Ks', 'Qs', 'As', '2s'])
    ))
      .toEqual({
        communityCards: cnToInt(['9s', '6h', 'Ts', '4d', 'Js']),
        playerCards: cnToInt(['Ks', 'Qs']),
        dealerCards: cnToInt(['As', '2s']),
        profit: 55,
        edge: 55
      });
  });

  it('should give 10:1 on Four of a Kind', () => {
    expect(binding.runUthSimulations(
      cnToInt(['7s', 'Jc', 'Js', '4c', '7h', 'Jh', 'Jd', '7d', '7c'])
    ))
      .toEqual({
        communityCards: cnToInt(['7s', 'Jc', 'Js', '4c', '7h']),
        playerCards: cnToInt(['Jh', 'Jd']),
        dealerCards: cnToInt(['7d', '7c']),
        profit: 15,
        edge: 15
      });
  });

  it('should give 3:1 on Full House', () => {
    expect(binding.runUthSimulations(
      cnToInt(['As', '7d', 'Ad', '3s', 'Tc', 'Ah', '3d', '9d', '9c'])
    ))
      .toEqual({
        communityCards: cnToInt(['As', '7d', 'Ad', '3s', 'Tc']),
        playerCards: cnToInt(['Ah', '3d']),
        dealerCards: cnToInt(['9d', '9c']),
        profit: 8,
        edge: 8
      });
  });

  it('should give 3:2 on Flush', () => {
    expect(binding.runUthSimulations(
      cnToInt(['Jh', '2d', 'Ah', '7h', '6c', 'Kh', '9h', '6s', '8h'])
    ))
      .toEqual({
        communityCards: cnToInt(['Jh', '2d', 'Ah', '7h', '6c']),
        playerCards: cnToInt(['Kh', '9h']),
        dealerCards: cnToInt(['6s', '8h']),
        profit: 6.5,
        edge: 6.5
      });
  });

  it('should give 1:1 on Straight', () => {
    expect(binding.runUthSimulations(
      cnToInt(['8s', 'Th', '6d', 'Jc', 'Kh', '9c', 'Qd', 'Js', '2d'])
    ))
      .toEqual({
        communityCards: cnToInt(['8s', 'Th', '6d', 'Jc', 'Kh']),
        playerCards: cnToInt(['9c', 'Qd']),
        dealerCards: cnToInt(['Js', '2d']),
        profit: 6,
        edge: 6
      });
  });

  it('should give nothing on Two Pair', () => {
    expect(binding.runUthSimulations(
      cnToInt(['Qd', '6s', 'As', '7h', 'Kd', 'Ah', 'Qc', '8d', 'Kc'])
    ))
      .toEqual({
        communityCards: cnToInt(['Qd', '6s', 'As', '7h', 'Kd']),
        playerCards: cnToInt(['Ah', 'Qc']),
        dealerCards: cnToInt(['8d', 'Kc']),
        profit: 5,
        edge: 5
      });
  });

  it('should give nothing on One Pair', () => {
    expect(binding.runUthSimulations(
      cnToInt(['Js', '2s', '5s', '6h', 'Kh', 'Ah', 'Jc', 'Ac', '4h'])
    ))
      .toEqual({
        communityCards: cnToInt(['Js', '2s', '5s', '6h', 'Kh']),
        playerCards: cnToInt(['Ah', 'Jc']),
        dealerCards: cnToInt(['Ac', '4h']),
        profit: 4,
        edge: 4
      });
  });

  it('should give nothing on High Card', () => {
    expect(binding.runUthSimulations(
      cnToInt(['3s', '4s', '9s', '5h', '6s', 'Jh', 'Tc', '8c', 'Th'])
    ))
      .toEqual({
        communityCards: cnToInt(['3s', '4s', '9s', '5h', '6s']),
        playerCards: cnToInt(['Jh', 'Tc']),
        dealerCards: cnToInt(['8c', 'Th']),
        profit: 4,
        edge: 4
      });
  });

  it('should lose blind bet if you lose', () => {
    expect(binding.runUthSimulations(
      cnToInt(['Qs', '6h', 'Ts', '4d', 'Js', '9s', '8s', 'As', 'Ks'])
    ))
      .toEqual({
        communityCards: cnToInt(['Qs', '6h', 'Ts', '4d', 'Js']),
        playerCards: cnToInt(['9s', '8s']),
        dealerCards: cnToInt(['As', 'Ks']),
        profit: -3,
        edge: -3
      });
  });

  it('should give nothing if you push', () => {
    expect(binding.runUthSimulations(
      cnToInt(['Ah', '7c', '9d', '6h', '9c', 'Qh', 'Ts', 'Qs', 'Th'])
    ))
      .toEqual({
        communityCards: cnToInt(['Ah', '7c', '9d', '6h', '9c']),
        playerCards: cnToInt(['Qh', 'Ts']),
        dealerCards: cnToInt(['Qs', 'Th']),
        profit: 0,
        edge: 0
      });
  });
});

describe('Basic strategy', () => {
  describe('Preflop 4x rules', () => {
    it('should give 5 profit AA 4x preflop win, dealer qualifies, no blind pay', () => {
      expect(binding.runUthSimulations(
        cnToInt(['9c', 'Th', '2c', '9d', 'Kc', 'Ac', 'Ad', '4c', '4d'])
      ))
        .toEqual({
          communityCards: cnToInt(['9c', 'Th', '2c', '9d', 'Kc']),
          playerCards: cnToInt(['Ac', 'Ad']),
          dealerCards: cnToInt(['4c', '4d']),
          profit: 5,
          edge: 5
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
          edge: 6.5
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
          edge: 5
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
          edge: 5
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
          edge: -6
        });
    });

    it('should give -4 profit K4o- 1x post-river loss, dealer qualifies, no blind pay', () => {
      expect(binding.runUthSimulations(
        cnToInt(['2d', 'Ac', '2s', '6c', '7d', 'Kc', '4h', '3d', '3h'])
      ))
        .toEqual({
          communityCards: cnToInt(['2d', 'Ac', '2s', '6c', '7d']),
          playerCards: cnToInt(['Kc', '4h']),
          dealerCards: cnToInt(['3d', '3h']),
          profit: -3,
          edge: -3
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
          edge: 5
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
          edge: 4
        });
    });

    it('should give -6 profit Q8o+ 4x preflop loss, dealer qualifies, no blind pay', () => {
      expect(binding.runUthSimulations(
        cnToInt(['5h', 'Jc', 'Td', '5s', 'Kc', 'Qh', '8c', 'Ts', '4d'])
      ))
        .toEqual({
          communityCards: cnToInt(['5h', 'Jc', 'Td', '5s', 'Kc']),
          playerCards: cnToInt(['Qh', '8c']),
          dealerCards: cnToInt(['Ts', '4d']),
          profit: -6,
          edge: -6
        });
    });

    it('should give -3 profit Q7o- 1x post-river loss, dealer qualifies, no blind pay', () => {
      expect(binding.runUthSimulations(
        cnToInt(['5h', 'Jc', 'Td', '5s', 'Kc', 'Qh', '7c', 'Ts', '4d'])
      ))
        .toEqual({
          communityCards: cnToInt(['5h', 'Jc', 'Td', '5s', 'Kc']),
          playerCards: cnToInt(['Qh', '7c']),
          dealerCards: cnToInt(['Ts', '4d']),
          profit: -3,
          edge: -3
        });
    });

    it('should give 2 profit Q6s+ 4x preflop win, dealer doesnt qualify, no blind pay', () => {
      expect(binding.runUthSimulations(
        cnToInt(['6c', '5s', '3h', 'Qd', 'Tc', 'Qh', '6h', '4c', 'Ac'])
      ))
        .toEqual({
          communityCards: cnToInt(['6c', '5s', '3h', 'Qd', 'Tc']),
          playerCards: cnToInt(['Qh', '6h']),
          dealerCards: cnToInt(['4c', 'Ac']),
          profit: 4,
          edge: 4
        });
    });

    it('should give 4 profit Q5s- 2x postflop win, dealer doesnt qualify, no blind pay', () => {
      expect(binding.runUthSimulations(
        cnToInt(['6c', '5s', '3h', 'Qd', 'Tc', 'Qh', '5h', '4c', 'Ac'])
      ))
        .toEqual({
          communityCards: cnToInt(['6c', '5s', '3h', 'Qd', 'Tc']),
          playerCards: cnToInt(['Qh', '5h']),
          dealerCards: cnToInt(['4c', 'Ac']),
          profit: 2,
          edge: 2
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
          edge: 4
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
          edge: -5
        });
    });

    it('should give 2 profit J9o- 2x postflop win, dealer doesnt qualify, no blind pay', () => {
      expect(binding.runUthSimulations(
        cnToInt(['4d', '2h', '9d', 'Kd', '3c', 'Jh', '9c', 'Ac', 'Qs'])
      ))
        .toEqual({
          communityCards: cnToInt(['4d', '2h', '9d', 'Kd', '3c']),
          playerCards: cnToInt(['Jh', '9c']),
          dealerCards: cnToInt(['Ac', 'Qs']),
          profit: 2,
          edge: 2
        });
    });

    it('should give -6 profit J8s+ 4x preflop loss, dealer qualifies, no blind pay', () => {
      expect(binding.runUthSimulations(
        cnToInt(['7s', 'Ad', '5c', 'Kc', '9h', 'Jd', '8d', '9d', '2h'])
      ))
        .toEqual({
          communityCards: cnToInt(['7s', 'Ad', '5c', 'Kc', '9h']),
          playerCards: cnToInt(['Jd', '8d']),
          dealerCards: cnToInt(['9d', '2h']),
          profit: -6,
          edge: -6
        });
    });

    it('should give -4 profit J7s- 2x postflop loss, dealer qualifies, no blind pay', () => {
      expect(binding.runUthSimulations(
        cnToInt(['7s', 'Ad', '5c', 'Kc', '9h', 'Jd', '7d', '9d', '2h'])
      ))
        .toEqual({
          communityCards: cnToInt(['7s', 'Ad', '5c', 'Kc', '9h']),
          playerCards: cnToInt(['Jd', '7d']),
          dealerCards: cnToInt(['9d', '2h']),
          profit: -4,
          edge: -4
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
          edge: 4
        });
    });

    it('should give 2 profit 22 1x post-river win, dealer doesnt qualify, no blind pay', () => {
      expect(binding.runUthSimulations(
        cnToInt(['6s', '7s', 'Tc', '5d', 'Jc', '2s', '2d', 'Ks', 'Qs'])
      ))
        .toEqual({
          communityCards: cnToInt(['6s', '7s', 'Tc', '5d', 'Jc']),
          playerCards: cnToInt(['2s', '2d']),
          dealerCards: cnToInt(['Ks', 'Qs']),
          profit: 1,
          edge: 1
        });
    });
  });

  describe('Postflop 2x rules', () => {
    it('should give -4 profit two pair or better 2x postflop loss, dealer qualifies, no blind pay', () => {
      expect(binding.runUthSimulations(
        cnToInt(['8d', 'Qs', '8h', 'Tc', 'Kh', '2c', '2h', '7s', '7h'])
      ))
        .toEqual({
          communityCards: cnToInt(['8d', 'Qs', '8h', 'Tc', 'Kh']),
          playerCards: cnToInt(['2c', '2h']),
          dealerCards: cnToInt(['7s', '7h']),
          profit: -4,
          edge: -4
        });
    });

    it('should give 3 profit two pair or better 2x postflop win, dealer qualifies, no blind pay', () => {
      expect(binding.runUthSimulations(
        cnToInt(['8d', 'Qs', '8h', 'Tc', 'Kh', '2c', 'Qh', '7s', '7h'])
      ))
        .toEqual({
          communityCards: cnToInt(['8d', 'Qs', '8h', 'Tc', 'Kh']),
          playerCards: cnToInt(['2c', 'Qh']),
          dealerCards: cnToInt(['7s', '7h']),
          profit: 3,
          edge: 3
        });
    });

    it('should give -3 profit worse than 2 pair with pair on board 1x post-river loss, dealer qualifies, no blind pay', () => {
      expect(binding.runUthSimulations(
        cnToInt(['Kc', 'Qd', 'Qc', 'Th', '7s', 'Jh', '4d', '9s', '9h'])
      ))
        .toEqual({
          communityCards: cnToInt(['Kc', 'Qd', 'Qc', 'Th', '7s']),
          playerCards: cnToInt(['Jh', '4d']),
          dealerCards: cnToInt(['9s', '9h']),
          profit: -3,
          edge: -3
        });
    });

    it('should give 2 profit hidden pair except pocket deuces 2x postflop win, dealer doesnt qualify, no blind pay', () => {
      expect(binding.runUthSimulations(
        cnToInt(['7d', '2h', '5s', 'Ts', '8s', '2c', '3h', '6h', 'Ac'])
      ))
        .toEqual({
          communityCards: cnToInt(['7d', '2h', '5s', 'Ts', '8s']),
          playerCards: cnToInt(['2c', '3h']),
          dealerCards: cnToInt(['6h', 'Ac']),
          profit: 2,
          edge: 2
        });
    });

    it('should give -3 profit pocket deuces one pair on flop 1x post-river loss, dealer qualifies, no blind pay', () => {
      expect(binding.runUthSimulations(
        cnToInt(['Ad', '5c', '7s', '4c', '6c', '2c', '2h', '6h', 'Ac'])
      ))
        .toEqual({
          communityCards: cnToInt(['Ad', '5c', '7s', '4c', '6c']),
          playerCards: cnToInt(['2c', '2h']),
          dealerCards: cnToInt(['6h', 'Ac']),
          profit: -3,
          edge: -3
        });
    });

    it('should give -4 profit four to a flush including hidden 10+ to flush 2x postflop loss, dealer qualifies, no blind pay', () => {
      expect(binding.runUthSimulations(
        cnToInt(['Ah', '5d', '9d', '5h', '5s', 'Td', '2d', 'Js', 'Ac'])
      ))
        .toEqual({
          communityCards: cnToInt(['Ah', '5d', '9d', '5h', '5s']),
          playerCards: cnToInt(['Td', '2d']),
          dealerCards: cnToInt(['Js', 'Ac']),
          profit: -4,
          edge: -4
        });
    });

    it('should give -4 profit four to a flush including hidden 9 to flush 1x post-river win, dealer qualifies, no blind pay', () => {
      expect(binding.runUthSimulations(
        cnToInt(['Ah', '5d', 'Td', '5h', '6d', '9d', '2d', 'Js', 'Ac'])
      ))
        .toEqual({
          communityCards: cnToInt(['Ah', '5d', 'Td', '5h', '6d']),
          playerCards: cnToInt(['9d', '2d']),
          dealerCards: cnToInt(['Js', 'Ac']),
          profit: 3.5,
          edge: 3.5
        });
    });

    it('should give -3 profit three to a flush including hidden 10+ to flush 1x post-river loss, dealer qualifies, no blind pay', () => {
      expect(binding.runUthSimulations(
        cnToInt(['Ah', '5d', '9d', '5h', '5s', 'Td', '2h', 'Js', 'Ac'])
      ))
        .toEqual({
          communityCards: cnToInt(['Ah', '5d', '9d', '5h', '5s']),
          playerCards: cnToInt(['Td', '2h']),
          dealerCards: cnToInt(['Js', 'Ac']),
          profit: -3,
          edge: -3
        });
    });
  });

  describe('Post-river 1x rules', () => {
    it('should give -3 profit hidden pocket pair one pair on flop 1x post-river loss, dealer qualifies, no blind pay', () => {
      expect(binding.runUthSimulations(
        cnToInt(['Ad', '5c', '7s', '4c', '6c', '2c', '2h', '6h', 'Ac'])
      ))
        .toEqual({
          communityCards: cnToInt(['Ad', '5c', '7s', '4c', '6c']),
          playerCards: cnToInt(['2c', '2h']),
          dealerCards: cnToInt(['6h', 'Ac']),
          profit: -3,
          edge: -3
        });
    });

    it('should give 1 profit one pair or better on turn/river 1x post-river win, dealer doesnt, no blind pay', () => {
      expect(binding.runUthSimulations(
        cnToInt(['8d', '2c', '4c', '6d', 'Ks', '6h', '5d', 'Tc', 'Ac'])
      ))
        .toEqual({
          communityCards: cnToInt(['8d', '2c', '4c', '6d', 'Ks']),
          playerCards: cnToInt(['6h', '5d']),
          dealerCards: cnToInt(['Tc', 'Ac']),
          profit: 1,
          edge: 1
        });
    });

    it('should give -2 profit one pair or better on turn/river fold, dealer doesnt, no blind pay', () => {
      expect(binding.runUthSimulations(
        cnToInt(['Ad', 'Td', '6c', 'Ks', 'Qc', '2h', '3c', '5h', 'Qd'])
      ))
        .toEqual({
          communityCards: cnToInt(['Ad', 'Td', '6c', 'Ks', 'Qc']),
          playerCards: cnToInt(['2h', '3c']),
          dealerCards: cnToInt(['5h', 'Qd']),
          profit: -2,
          edge: -2
        });
    });

    it('should give -3 profit 1x post-river with 20 outs', () => {
      expect(binding.runUthSimulations(
        cnToInt(['Ac', 'Kc', '6c', '6h', '7c', 'Qh', '2d', '3d', '4c'])
      ))
        .toEqual({
          communityCards: cnToInt(['Ac', 'Kc', '6c', '6h', '7c']),
          playerCards: cnToInt(['Qh', '2d']),
          dealerCards: cnToInt(['3d', '4c']),
          profit: -3,
          edge: -3
        });
    });

    it('should give -2 profit post-river fold with 23 outs', () => {
      expect(binding.runUthSimulations(
        cnToInt(['5c', '7h', '4d', '9s', '8d', 'Kc', '2h', 'Qd', '9d'])
      ))
        .toEqual({
          communityCards: cnToInt(['5c', '7h', '4d', '9s', '8d']),
          playerCards: cnToInt(['Kc', '2h']),
          dealerCards: cnToInt(['Qd', '9d']),
          profit: -2,
          edge: -2
        });
    });

    it('should give -2 profit post-river fold, dealer doesnt qualify', () => {
      expect(binding.runUthSimulations(
        cnToInt(['5c', '7h', '4d', '9s', '8d', 'Kc', '2h', 'Qd', '2d'])
      ))
        .toEqual({
          communityCards: cnToInt(['5c', '7h', '4d', '9s', '8d']),
          playerCards: cnToInt(['Kc', '2h']),
          dealerCards: cnToInt(['Qd', '2d']),
          profit: -2,
          edge: -2
        });
    });
  });

});