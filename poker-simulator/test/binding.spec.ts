import { cardNotationToInt } from '../../src/app/utils/cardConversion';
import { SimulationResults } from '../../src/app/models/simulationResults';
import * as bindings from 'bindings';
const binding: {
  runUthSimulations: (
    cards: number[],
    numberOfSimulations: number,
    handsPerSession: number,
    knownDealerCards: number,
    knownFlopCards: number,
    knownTurnRiverCards: number,
    callback: (
      profit: number,
      edge: number,
      stDev: number,
      cards: { communityCards: number[], playerCards: number[], dealerCards: number[] }
    ) => void
  ) => Promise<SimulationResults>
} = bindings('native');
const cnToInt = (cards: string[]) => cards.map(card => cardNotationToInt(card));

describe('Base scenarios', () => {
  it('should distribute 5 community cards then 2 player cards then 2 dealer cards from 52 card deck', (done) => {
    binding.runUthSimulations(
      [1, 2, 3, 4, 5, 6, 7, 8,
        9, 10, 11, 12, 13, 14, 15,
        16, 17, 18, 19, 20, 21, 22,
        23, 24, 25, 26, 27, 28, 29,
        30, 31, 32, 33, 34, 35, 36,
        37, 38, 39, 40, 41, 42, 43,
        44, 45, 46, 47, 48, 49, 50,
        51, 52], 0, 1, 0, 0, 0,
      (profit, edge, stDev, cards) => {
        expect({ profit, edge, stDev, ...cards }).toEqual({
          communityCards: [1, 2, 3, 4, 5],
          playerCards: [6, 7],
          dealerCards: [8, 9],
          profit: -6,
          edge: -6,
          stDev: 0
        });
        done();
      }
    );
  });

  it('should distribute 5 community cards then 2 player cards then 2 dealer cards from 9 card deck', (done) => {
    binding.runUthSimulations(
      [1, 2, 3, 4, 5, 6, 7, 8, 9], 0, 1, 0, 0, 0,
      (profit, edge, stDev, cards) => {
        expect({ profit, edge, stDev, ...cards }).toEqual({
          communityCards: [1, 2, 3, 4, 5],
          playerCards: [6, 7],
          dealerCards: [8, 9],
          profit: -6,
          edge: -6,
          stDev: 0
        });
        done();
      }
    );
  });

  it('should give a different result if one card changed', (done) => {
    binding.runUthSimulations(
      [10, 2, 3, 4, 5, 6, 7, 8, 9], 0, 1, 0, 0, 0,
      (profit, edge, stDev, cards) => {
        expect({ profit, edge, stDev, ...cards }).not.toEqual({
          communityCards: [1, 2, 3, 4, 5],
          playerCards: [6, 7],
          dealerCards: [8, 9],
          profit: -6,
          edge: -6,
          stDev: 0
        });
        done();
      }
    );
  });

  it('should give same result using cardNotationToInt passed to runIthSimulations', (done) => {
    binding.runUthSimulations(
      cnToInt(['2c', '2d', '2h', '2s', '3c', '3d', '3h', '3s', '4c']), 0, 1, 0, 0, 0,
      (profit, edge, stDev, cards) => {
        expect({ profit, edge, stDev, ...cards }).toEqual({
          communityCards: [1, 2, 3, 4, 5],
          playerCards: [6, 7],
          dealerCards: [8, 9],
          profit: -6,
          edge: -6,
          stDev: 0
        });
        done();
      }
    );
  });

  it('should give same result using cardNotationToInt everywhere', (done) => {
    binding.runUthSimulations(
      cnToInt(['2c', '2d', '2h', '2s', '3c', '3d', '3h', '3s', '4c']), 0, 1, 0, 0, 0,
      (profit, edge, stDev, cards) => {
        expect({ profit, edge, stDev, ...cards }).toEqual({
          communityCards: cnToInt(['2c', '2d', '2h', '2s', '3c']),
          playerCards: cnToInt(['3d', '3h']),
          dealerCards: cnToInt(['3s', '4c']),
          profit: -6,
          edge: -6,
          stDev: 0
        });
        done();
      }
    );
  });
});

describe('Blind payouts', () => {
  it('should give 500:1 on Royal Flush', (done) => {
    binding.runUthSimulations(
      cnToInt(['Qs', '6h', 'Ts', '4d', 'Js', 'As', 'Ks', '9s', '8s']), 0, 1, 0, 0, 0,
      (profit, edge, stDev, cards) => {
        expect({ profit, edge, stDev, ...cards }).toEqual({
          communityCards: cnToInt(['Qs', '6h', 'Ts', '4d', 'Js']),
          playerCards: cnToInt(['As', 'Ks']),
          dealerCards: cnToInt(['9s', '8s']),
          profit: 505,
          edge: 505,
          stDev: 0
        });
        done();
      }
    );
  });

  it('should give 50:1 on Straight Flush', (done) => {
    binding.runUthSimulations(
      cnToInt(['9s', '6h', 'Ts', '4d', 'Js', 'Ks', 'Qs', 'As', '2s']), 0, 1, 0, 0, 0,
      (profit, edge, stDev, cards) => {
        expect({ profit, edge, stDev, ...cards }).toEqual({
          communityCards: cnToInt(['9s', '6h', 'Ts', '4d', 'Js']),
          playerCards: cnToInt(['Ks', 'Qs']),
          dealerCards: cnToInt(['As', '2s']),
          profit: 55,
          edge: 55,
          stDev: 0
        });
        done();
      }
    );
  });

  it('should give 10:1 on Four of a Kind', (done) => {
    binding.runUthSimulations(
      cnToInt(['7s', 'Jc', 'Js', '4c', '7h', 'Jh', 'Jd', '7d', '7c']), 0, 1, 0, 0, 0,
      (profit, edge, stDev, cards) => {
        expect({ profit, edge, stDev, ...cards }).toEqual({
          communityCards: cnToInt(['7s', 'Jc', 'Js', '4c', '7h']),
          playerCards: cnToInt(['Jh', 'Jd']),
          dealerCards: cnToInt(['7d', '7c']),
          profit: 15,
          edge: 15,
          stDev: 0
        });
        done();
      }
    );
  });

  it('should give 3:1 on Full House', (done) => {
    binding.runUthSimulations(
      cnToInt(['As', '7d', 'Ad', '3s', 'Tc', 'Ah', '3d', '9d', '9c']), 0, 1, 0, 0, 0,
      (profit, edge, stDev, cards) => {
        expect({ profit, edge, stDev, ...cards }).toEqual({
          communityCards: cnToInt(['As', '7d', 'Ad', '3s', 'Tc']),
          playerCards: cnToInt(['Ah', '3d']),
          dealerCards: cnToInt(['9d', '9c']),
          profit: 8,
          edge: 8,
          stDev: 0
        });
        done();
      }
    );
  });

  it('should give 3:2 on Flush', (done) => {
    binding.runUthSimulations(
      cnToInt(['Jh', '2d', 'Ah', '7h', '6c', 'Kh', '9h', '6s', '8h']), 0, 1, 0, 0, 0,
      (profit, edge, stDev, cards) => {
        expect({ profit, edge, stDev, ...cards }).toEqual({
          communityCards: cnToInt(['Jh', '2d', 'Ah', '7h', '6c']),
          playerCards: cnToInt(['Kh', '9h']),
          dealerCards: cnToInt(['6s', '8h']),
          profit: 6.5,
          edge: 6.5,
          stDev: 0
        });
        done();
      }
    );
  });

  it('should give 1:1 on Straight', (done) => {
    binding.runUthSimulations(
      cnToInt(['8s', 'Th', '6d', 'Jc', 'Kh', '9c', 'Qd', 'Js', '2d']), 0, 1, 0, 0, 0,
      (profit, edge, stDev, cards) => {
        expect({ profit, edge, stDev, ...cards }).toEqual({
          communityCards: cnToInt(['8s', 'Th', '6d', 'Jc', 'Kh']),
          playerCards: cnToInt(['9c', 'Qd']),
          dealerCards: cnToInt(['Js', '2d']),
          profit: 6,
          edge: 6,
          stDev: 0
        });
        done();
      }
    );
  });

  it('should give nothing on Two Pair', (done) => {
    binding.runUthSimulations(
      cnToInt(['Qd', '6s', 'As', '7h', 'Kd', 'Ah', 'Qc', '8d', 'Kc']), 0, 1, 0, 0, 0,
      (profit, edge, stDev, cards) => {
        expect({ profit, edge, stDev, ...cards }).toEqual({
          communityCards: cnToInt(['Qd', '6s', 'As', '7h', 'Kd']),
          playerCards: cnToInt(['Ah', 'Qc']),
          dealerCards: cnToInt(['8d', 'Kc']),
          profit: 5,
          edge: 5,
          stDev: 0
        });
        done();
      }
    );
  });

  it('should give nothing on One Pair', (done) => {
    binding.runUthSimulations(
      cnToInt(['Js', '2s', '5s', '6h', 'Kh', 'Ah', 'Jc', 'Ac', '4h']), 0, 1, 0, 0, 0,
      (profit, edge, stDev, cards) => {
        expect({ profit, edge, stDev, ...cards }).toEqual({
          communityCards: cnToInt(['Js', '2s', '5s', '6h', 'Kh']),
          playerCards: cnToInt(['Ah', 'Jc']),
          dealerCards: cnToInt(['Ac', '4h']),
          profit: 4,
          edge: 4,
          stDev: 0
        });
        done();
      }
    );
  });

  it('should give nothing on High Card', (done) => {
    binding.runUthSimulations(
      cnToInt(['3s', '4s', '9s', '5h', '6s', 'Jh', 'Tc', '8c', 'Th']), 0, 1, 0, 0, 0,
      (profit, edge, stDev, cards) => {
        expect({ profit, edge, stDev, ...cards }).toEqual({
          communityCards: cnToInt(['3s', '4s', '9s', '5h', '6s']),
          playerCards: cnToInt(['Jh', 'Tc']),
          dealerCards: cnToInt(['8c', 'Th']),
          profit: 4,
          edge: 4,
          stDev: 0
        });
        done();
      }
    );
  });

  it('should lose blind bet if you lose', (done) => {
    binding.runUthSimulations(
      cnToInt(['Qs', '6h', 'Ts', '4d', 'Js', '9s', '8s', 'As', 'Ks']), 0, 1, 0, 0, 0,
      (profit, edge, stDev, cards) => {
        expect({ profit, edge, stDev, ...cards }).toEqual({
          communityCards: cnToInt(['Qs', '6h', 'Ts', '4d', 'Js']),
          playerCards: cnToInt(['9s', '8s']),
          dealerCards: cnToInt(['As', 'Ks']),
          profit: -3,
          edge: -3,
          stDev: 0
        });
        done();
      }
    );
  });

  it('should give nothing if you push', (done) => {
    binding.runUthSimulations(
      cnToInt(['Ah', '7c', '9d', '6h', '9c', 'Qh', 'Ts', 'Qs', 'Th']), 0, 1, 0, 0, 0,
      (profit, edge, stDev, cards) => {
        expect({ profit, edge, stDev, ...cards }).toEqual({
          communityCards: cnToInt(['Ah', '7c', '9d', '6h', '9c']),
          playerCards: cnToInt(['Qh', 'Ts']),
          dealerCards: cnToInt(['Qs', 'Th']),
          profit: 0,
          edge: 0,
          stDev: 0
        });
        done();
      }
    );
  });
});

describe('Basic strategy', () => {
  describe('Preflop 4x rules', () => {
    it('should give 5 profit AA 4x preflop win, dealer qualifies, no blind pay', (done) => {
      binding.runUthSimulations(
        cnToInt(['9c', 'Th', '2c', '9d', 'Kc', 'Ac', 'Ad', '4c', '4d']), 0, 1, 0, 0, 0,
        (profit, edge, stDev, cards) => {
          expect({ profit, edge, stDev, ...cards }).toEqual({
            communityCards: cnToInt(['9c', 'Th', '2c', '9d', 'Kc']),
            playerCards: cnToInt(['Ac', 'Ad']),
            dealerCards: cnToInt(['4c', '4d']),
            profit: 5,
            edge: 5,
            stDev: 0
          });
          done();
        }
      );
    });

    it('should give 6.5 profit A2s+ 4x preflop win, dealer qualifies, flush blind pay', (done) => {
      binding.runUthSimulations(
        cnToInt(['Jc', 'Ad', '8s', 'Tc', '7c', 'Ac', '2c', '9h', '4c']), 0, 1, 0, 0, 0,
        (profit, edge, stDev, cards) => {
          expect({ profit, edge, stDev, ...cards }).toEqual({
            communityCards: cnToInt(['Jc', 'Ad', '8s', 'Tc', '7c']),
            playerCards: cnToInt(['Ac', '2c']),
            dealerCards: cnToInt(['9h', '4c']),
            profit: 6.5,
            edge: 6.5,
            stDev: 0
          });
          done();
        }
      );
    });

    it('should give 5 profit A2o+ 4x preflop win, dealer qualifies, no blind pay', (done) => {
      binding.runUthSimulations(
        cnToInt(['Jc', 'Ad', '8s', 'Tc', '7c', 'Ac', '2h', 'Jh', '4c']), 0, 1, 0, 0, 0,
        (profit, edge, stDev, cards) => {
          expect({ profit, edge, stDev, ...cards }).toEqual({
            communityCards: cnToInt(['Jc', 'Ad', '8s', 'Tc', '7c']),
            playerCards: cnToInt(['Ac', '2h']),
            dealerCards: cnToInt(['Jh', '4c']),
            profit: 5,
            edge: 5,
            stDev: 0
          });
          done();
        }
      );
    });

    it('should give 5 profit KK 4x preflop win, dealer qualifies, no blind pay', (done) => {
      binding.runUthSimulations(
        cnToInt(['6c', '9h', '2c', '6h', '7s', 'Kd', 'Ks', 'Qc', '5s']), 0, 1, 0, 0, 0,
        (profit, edge, stDev, cards) => {
          expect({ profit, edge, stDev, ...cards }).toEqual({
            communityCards: cnToInt(['6c', '9h', '2c', '6h', '7s']),
            playerCards: cnToInt(['Kd', 'Ks']),
            dealerCards: cnToInt(['Qc', '5s']),
            profit: 5,
            edge: 5,
            stDev: 0
          });
          done();
        }
      );
    });

    it('should give -6 profit K5o+ 4x preflop loss, dealer qualifies, no blind pay', (done) => {
      binding.runUthSimulations(
        cnToInt(['2d', 'Ac', '2s', '6c', '7d', 'Kc', '5h', '3d', '3h']), 0, 1, 0, 0, 0,
        (profit, edge, stDev, cards) => {
          expect({ profit, edge, stDev, ...cards }).toEqual({
            communityCards: cnToInt(['2d', 'Ac', '2s', '6c', '7d']),
            playerCards: cnToInt(['Kc', '5h']),
            dealerCards: cnToInt(['3d', '3h']),
            profit: -6,
            edge: -6,
            stDev: 0
          });
          done();
        }
      );
    });

    it('should give -4 profit K4o- 1x post-river loss, dealer qualifies, no blind pay', (done) => {
      binding.runUthSimulations(
        cnToInt(['2d', 'Ac', '2s', '6c', '7d', 'Kc', '4h', '3d', '3h']), 0, 1, 0, 0, 0,
        (profit, edge, stDev, cards) => {
          expect({ profit, edge, stDev, ...cards }).toEqual({
            communityCards: cnToInt(['2d', 'Ac', '2s', '6c', '7d']),
            playerCards: cnToInt(['Kc', '4h']),
            dealerCards: cnToInt(['3d', '3h']),
            profit: -3,
            edge: -3,
            stDev: 0
          });
          done();
        }
      );
    });

    it('should give 5 profit K2s+ 4x preflop win, dealer qualifies, no blind pay', (done) => {
      binding.runUthSimulations(
        cnToInt(['7h', '2h', 'Td', '5c', '7d', 'Kc', '2c', 'Jc', '4c']), 0, 1, 0, 0, 0,
        (profit, edge, stDev, cards) => {
          expect({ profit, edge, stDev, ...cards }).toEqual({
            communityCards: cnToInt(['7h', '2h', 'Td', '5c', '7d']),
            playerCards: cnToInt(['Kc', '2c']),
            dealerCards: cnToInt(['Jc', '4c']),
            profit: 5,
            edge: 5,
            stDev: 0
          });
          done();
        }
      );
    });

    it('should give 4 profit QQ 4x preflop win, dealer doesnt qualify, no blind pay', (done) => {
      binding.runUthSimulations(
        cnToInt(['7c', 'Ac', '2d', 'Kh', '4d', 'Qh', 'Qs', '3h', '6d']), 0, 1, 0, 0, 0,
        (profit, edge, stDev, cards) => {
          expect({ profit, edge, stDev, ...cards }).toEqual({
            communityCards: cnToInt(['7c', 'Ac', '2d', 'Kh', '4d']),
            playerCards: cnToInt(['Qh', 'Qs']),
            dealerCards: cnToInt(['3h', '6d']),
            profit: 4,
            edge: 4,
            stDev: 0
          });
          done();
        }
      );
    });

    it('should give -6 profit Q8o+ 4x preflop loss, dealer qualifies, no blind pay', (done) => {
      binding.runUthSimulations(
        cnToInt(['5h', 'Jc', 'Td', '5s', 'Kc', 'Qh', '8c', 'Ts', '4d']), 0, 1, 0, 0, 0,
        (profit, edge, stDev, cards) => {
          expect({ profit, edge, stDev, ...cards }).toEqual({
            communityCards: cnToInt(['5h', 'Jc', 'Td', '5s', 'Kc']),
            playerCards: cnToInt(['Qh', '8c']),
            dealerCards: cnToInt(['Ts', '4d']),
            profit: -6,
            edge: -6,
            stDev: 0
          });
          done();
        }
      );
    });

    it('should give -3 profit Q7o- 1x post-river loss, dealer qualifies, no blind pay', (done) => {
      binding.runUthSimulations(
        cnToInt(['5h', 'Jc', 'Td', '5s', 'Kc', 'Qh', '7c', 'Ts', '4d']), 0, 1, 0, 0, 0,
        (profit, edge, stDev, cards) => {
          expect({ profit, edge, stDev, ...cards }).toEqual({
            communityCards: cnToInt(['5h', 'Jc', 'Td', '5s', 'Kc']),
            playerCards: cnToInt(['Qh', '7c']),
            dealerCards: cnToInt(['Ts', '4d']),
            profit: -3,
            edge: -3,
            stDev: 0
          });
          done();
        }
      );
    });

    it('should give 2 profit Q6s+ 4x preflop win, dealer doesnt qualify, no blind pay', (done) => {
      binding.runUthSimulations(
        cnToInt(['6c', '5s', '3h', 'Qd', 'Tc', 'Qh', '6h', '4c', 'Ac']), 0, 1, 0, 0, 0,
        (profit, edge, stDev, cards) => {
          expect({ profit, edge, stDev, ...cards }).toEqual({
            communityCards: cnToInt(['6c', '5s', '3h', 'Qd', 'Tc']),
            playerCards: cnToInt(['Qh', '6h']),
            dealerCards: cnToInt(['4c', 'Ac']),
            profit: 4,
            edge: 4,
            stDev: 0
          });
          done();
        }
      );
    });

    it('should give 4 profit Q5s- 2x postflop win, dealer doesnt qualify, no blind pay', (done) => {
      binding.runUthSimulations(
        cnToInt(['6c', '5s', '3h', 'Qd', 'Tc', 'Qh', '5h', '4c', 'Ac']), 0, 1, 0, 0, 0,
        (profit, edge, stDev, cards) => {
          expect({ profit, edge, stDev, ...cards }).toEqual({
            communityCards: cnToInt(['6c', '5s', '3h', 'Qd', 'Tc']),
            playerCards: cnToInt(['Qh', '5h']),
            dealerCards: cnToInt(['4c', 'Ac']),
            profit: 2,
            edge: 2,
            stDev: 0
          });
          done();
        }
      );
    });

    it('should give 4 profit JJ 4x preflop win, dealer doesnt qualify, no blind pay', (done) => {
      binding.runUthSimulations(
        cnToInt(['Js', '3s', '2h', '8s', 'Kh', 'Jh', 'Jc', 'Ac', '5d']), 0, 1, 0, 0, 0,
        (profit, edge, stDev, cards) => {
          expect({ profit, edge, stDev, ...cards }).toEqual({
            communityCards: cnToInt(['Js', '3s', '2h', '8s', 'Kh']),
            playerCards: cnToInt(['Jh', 'Jc']),
            dealerCards: cnToInt(['Ac', '5d']),
            profit: 4,
            edge: 4,
            stDev: 0
          });
          done();
        }
      );
    });

    it('should give -5 profit JTo 4x preflop loss, dealer doesnt qualify, no blind pay', (done) => {
      binding.runUthSimulations(
        cnToInt(['4d', '2h', '9d', 'Kd', '3c', 'Jh', 'Tc', 'Ac', 'Qs']), 0, 1, 0, 0, 0,
        (profit, edge, stDev, cards) => {
          expect({ profit, edge, stDev, ...cards }).toEqual({
            communityCards: cnToInt(['4d', '2h', '9d', 'Kd', '3c']),
            playerCards: cnToInt(['Jh', 'Tc']),
            dealerCards: cnToInt(['Ac', 'Qs']),
            profit: -5,
            edge: -5,
            stDev: 0
          });
          done();
        }
      );
    });

    it('should give 2 profit J9o- 2x postflop win, dealer doesnt qualify, no blind pay', (done) => {
      binding.runUthSimulations(
        cnToInt(['4d', '2h', '9d', 'Kd', '3c', 'Jh', '9c', 'Ac', 'Qs']), 0, 1, 0, 0, 0,
        (profit, edge, stDev, cards) => {
          expect({ profit, edge, stDev, ...cards }).toEqual({
            communityCards: cnToInt(['4d', '2h', '9d', 'Kd', '3c']),
            playerCards: cnToInt(['Jh', '9c']),
            dealerCards: cnToInt(['Ac', 'Qs']),
            profit: 2,
            edge: 2,
            stDev: 0
          });
          done();
        }
      );
    });

    it('should give -6 profit J8s+ 4x preflop loss, dealer qualifies, no blind pay', (done) => {
      binding.runUthSimulations(
        cnToInt(['7s', 'Ad', '5c', 'Kc', '9h', 'Jd', '8d', '9d', '2h']), 0, 1, 0, 0, 0,
        (profit, edge, stDev, cards) => {
          expect({ profit, edge, stDev, ...cards }).toEqual({
            communityCards: cnToInt(['7s', 'Ad', '5c', 'Kc', '9h']),
            playerCards: cnToInt(['Jd', '8d']),
            dealerCards: cnToInt(['9d', '2h']),
            profit: -6,
            edge: -6,
            stDev: 0
          });
          done();
        }
      );
    });

    it('should give -4 profit J7s- 2x postflop loss, dealer qualifies, no blind pay', (done) => {
      binding.runUthSimulations(
        cnToInt(['7s', 'Ad', '5c', 'Kc', '9h', 'Jd', '7d', '9d', '2h']), 0, 1, 0, 0, 0,
        (profit, edge, stDev, cards) => {
          expect({ profit, edge, stDev, ...cards }).toEqual({
            communityCards: cnToInt(['7s', 'Ad', '5c', 'Kc', '9h']),
            playerCards: cnToInt(['Jd', '7d']),
            dealerCards: cnToInt(['9d', '2h']),
            profit: -4,
            edge: -4,
            stDev: 0
          });
          done();
        }
      );
    });

    it('should give 4 profit 33+ 4x preflop win, dealer doesnt qualify, no blind pay', (done) => {
      binding.runUthSimulations(
        cnToInt(['6s', '7s', 'Tc', '5d', 'Jc', '3s', '3d', 'Ks', 'Qs']), 0, 1, 0, 0, 0,
        (profit, edge, stDev, cards) => {
          expect({ profit, edge, stDev, ...cards }).toEqual({
            communityCards: cnToInt(['6s', '7s', 'Tc', '5d', 'Jc']),
            playerCards: cnToInt(['3s', '3d']),
            dealerCards: cnToInt(['Ks', 'Qs']),
            profit: 4,
            edge: 4,
            stDev: 0
          });
          done();
        }
      );
    });

    it('should give 2 profit 22 1x post-river win, dealer doesnt qualify, no blind pay', (done) => {
      binding.runUthSimulations(
        cnToInt(['6s', '7s', 'Tc', '5d', 'Jc', '2s', '2d', 'Ks', 'Qs']), 0, 1, 0, 0, 0,
        (profit, edge, stDev, cards) => {
          expect({ profit, edge, stDev, ...cards }).toEqual({
            communityCards: cnToInt(['6s', '7s', 'Tc', '5d', 'Jc']),
            playerCards: cnToInt(['2s', '2d']),
            dealerCards: cnToInt(['Ks', 'Qs']),
            profit: 1,
            edge: 1,
            stDev: 0
          });
          done();
        }
      );
    });
  });

  describe('Postflop 2x rules', () => {
    it('should give -4 profit two pair or better 2x postflop loss, dealer qualifies, no blind pay', (done) => {
      binding.runUthSimulations(
        cnToInt(['8d', 'Qs', '8h', 'Tc', 'Kh', '2c', '2h', '7s', '7h']), 0, 1, 0, 0, 0,
        (profit, edge, stDev, cards) => {
          expect({ profit, edge, stDev, ...cards }).toEqual({
            communityCards: cnToInt(['8d', 'Qs', '8h', 'Tc', 'Kh']),
            playerCards: cnToInt(['2c', '2h']),
            dealerCards: cnToInt(['7s', '7h']),
            profit: -4,
            edge: -4,
            stDev: 0
          });
          done();
        }
      );
    });

    it('should give 3 profit two pair or better 2x postflop win, dealer qualifies, no blind pay', (done) => {
      binding.runUthSimulations(
        cnToInt(['8d', 'Qs', '8h', 'Tc', 'Kh', '2c', 'Qh', '7s', '7h']), 0, 1, 0, 0, 0,
        (profit, edge, stDev, cards) => {
          expect({ profit, edge, stDev, ...cards }).toEqual({
            communityCards: cnToInt(['8d', 'Qs', '8h', 'Tc', 'Kh']),
            playerCards: cnToInt(['2c', 'Qh']),
            dealerCards: cnToInt(['7s', '7h']),
            profit: 3,
            edge: 3,
            stDev: 0
          });
          done();
        }
      );
    });

    it('should give -3 profit worse than 2 pair with pair on board 1x post-river loss, dealer qualifies, no blind pay', (done) => {
      binding.runUthSimulations(
        cnToInt(['Kc', 'Qd', 'Qc', 'Th', '7s', 'Jh', '4d', '9s', '9h']), 0, 1, 0, 0, 0,
        (profit, edge, stDev, cards) => {
          expect({ profit, edge, stDev, ...cards }).toEqual({
            communityCards: cnToInt(['Kc', 'Qd', 'Qc', 'Th', '7s']),
            playerCards: cnToInt(['Jh', '4d']),
            dealerCards: cnToInt(['9s', '9h']),
            profit: -3,
            edge: -3,
            stDev: 0
          });
          done();
        }
      );
    });

    it('should give -2 profit 3 of a kind with 3 of a kind on board post-river fold, dealer qualifies, no blind pay', (done) => {
      binding.runUthSimulations(
        cnToInt(['Ac', 'Ad', 'As', '6h', '5d', '2c', '3h', '7s', '2s']), 0, 1, 0, 0, 0,
        (profit, edge, stDev, cards) => {
          expect({ profit, edge, stDev, ...cards }).toEqual({
            communityCards: cnToInt(['Ac', 'Ad', 'As', '6h', '5d']),
            playerCards: cnToInt(['2c', '3h']),
            dealerCards: cnToInt(['7s', '2s']),
            profit: -2,
            edge: -2,
            stDev: 0
          });
          done();
        }
      );
    });

    it('should give 2 profit hidden pair except pocket deuces 2x postflop win, dealer doesnt qualify, no blind pay', (done) => {
      binding.runUthSimulations(
        cnToInt(['7d', '2h', '5s', 'Ts', '8s', '2c', '3h', '6h', 'Ac']), 0, 1, 0, 0, 0,
        (profit, edge, stDev, cards) => {
          expect({ profit, edge, stDev, ...cards }).toEqual({
            communityCards: cnToInt(['7d', '2h', '5s', 'Ts', '8s']),
            playerCards: cnToInt(['2c', '3h']),
            dealerCards: cnToInt(['6h', 'Ac']),
            profit: 2,
            edge: 2,
            stDev: 0
          });
          done();
        }
      );
    });

    it('should give -3 profit pocket deuces one pair on flop 1x post-river loss, dealer qualifies, no blind pay', (done) => {
      binding.runUthSimulations(
        cnToInt(['Ad', '5c', '7s', '4c', '6c', '2c', '2h', '6h', 'Ac']), 0, 1, 0, 0, 0,
        (profit, edge, stDev, cards) => {
          expect({ profit, edge, stDev, ...cards }).toEqual({
            communityCards: cnToInt(['Ad', '5c', '7s', '4c', '6c']),
            playerCards: cnToInt(['2c', '2h']),
            dealerCards: cnToInt(['6h', 'Ac']),
            profit: -3,
            edge: -3,
            stDev: 0
          });
          done();
        }
      );
    });

    it('should give -4 profit four to a flush including hidden 10+ to flush 2x postflop loss, dealer qualifies, no blind pay', (done) => {
      binding.runUthSimulations(
        cnToInt(['Ah', '5d', '9d', '5h', '5s', 'Td', '2d', 'Js', 'Ac']), 0, 1, 0, 0, 0,
        (profit, edge, stDev, cards) => {
          expect({ profit, edge, stDev, ...cards }).toEqual({
            communityCards: cnToInt(['Ah', '5d', '9d', '5h', '5s']),
            playerCards: cnToInt(['Td', '2d']),
            dealerCards: cnToInt(['Js', 'Ac']),
            profit: -4,
            edge: -4,
            stDev: 0
          });
          done();
        }
      );
    });

    it('should give -4 profit four to a flush including hidden 9 to flush 1x post-river win, dealer qualifies, no blind pay', (done) => {
      binding.runUthSimulations(
        cnToInt(['Ah', '5d', 'Td', '5h', '6d', '9d', '2d', 'Js', 'Ac']), 0, 1, 0, 0, 0,
        (profit, edge, stDev, cards) => {
          expect({ profit, edge, stDev, ...cards }).toEqual({
            communityCards: cnToInt(['Ah', '5d', 'Td', '5h', '6d']),
            playerCards: cnToInt(['9d', '2d']),
            dealerCards: cnToInt(['Js', 'Ac']),
            profit: 3.5,
            edge: 3.5,
            stDev: 0
          });
          done();
        }
      );
    });

    it('should give -3 profit three to a flush including hidden 10+ to flush 1x post-river loss, dealer qualifies, no blind pay', (done) => {
      binding.runUthSimulations(
        cnToInt(['Ah', '5d', '9d', '5h', '5s', 'Td', '2h', 'Js', 'Ac']), 0, 1, 0, 0, 0,
        (profit, edge, stDev, cards) => {
          expect({ profit, edge, stDev, ...cards }).toEqual({
            communityCards: cnToInt(['Ah', '5d', '9d', '5h', '5s']),
            playerCards: cnToInt(['Td', '2h']),
            dealerCards: cnToInt(['Js', 'Ac']),
            profit: -3,
            edge: -3,
            stDev: 0
          });
          done();
        }
      );
    });
  });

  describe('Post-river 1x rules', () => {
    it('should give -3 profit hidden pocket pair one pair on flop 1x post-river loss, dealer qualifies, no blind pay', (done) => {
      binding.runUthSimulations(
        cnToInt(['Ad', '5c', '7s', '4c', '6c', '2c', '2h', '6h', 'Ac']), 0, 1, 0, 0, 0,
        (profit, edge, stDev, cards) => {
          expect({ profit, edge, stDev, ...cards }).toEqual({
            communityCards: cnToInt(['Ad', '5c', '7s', '4c', '6c']),
            playerCards: cnToInt(['2c', '2h']),
            dealerCards: cnToInt(['6h', 'Ac']),
            profit: -3,
            edge: -3,
            stDev: 0
          });
          done();
        }
      );
    });

    it('should give 1 profit hidden pair or better on turn/river 1x post-river win, dealer doesnt qualify, no blind pay', (done) => {
      binding.runUthSimulations(
        cnToInt(['8d', '2c', '4c', '6d', 'Ks', '6h', '5d', 'Tc', 'Ac']), 0, 1, 0, 0, 0,
        (profit, edge, stDev, cards) => {
          expect({ profit, edge, stDev, ...cards }).toEqual({
            communityCards: cnToInt(['8d', '2c', '4c', '6d', 'Ks']),
            playerCards: cnToInt(['6h', '5d']),
            dealerCards: cnToInt(['Tc', 'Ac']),
            profit: 1,
            edge: 1,
            stDev: 0
          });
          done();
        }
      );
    });

    it('should give -2 profit hidden pair or better on turn/river fold, dealer qualifies, no blind pay', (done) => {
      binding.runUthSimulations(
        cnToInt(['Ad', 'Td', '6c', 'Ks', 'Qc', '2h', '3c', '5h', 'Qd']), 0, 1, 0, 0, 0,
        (profit, edge, stDev, cards) => {
          expect({ profit, edge, stDev, ...cards }).toEqual({
            communityCards: cnToInt(['Ad', 'Td', '6c', 'Ks', 'Qc']),
            playerCards: cnToInt(['2h', '3c']),
            dealerCards: cnToInt(['5h', 'Qd']),
            profit: -2,
            edge: -2,
            stDev: 0
          });
          done();
        }
      );
    });

    it('should give -2 profit two pair with two pair on board after turn/river fold, dealer qualifies, no blind pay', (done) => {
      binding.runUthSimulations(
        cnToInt(['6c', 'Qh', '6d', '9h', 'Qc', '2d', '3c', '7h', '9d']), 0, 1, 0, 0, 0,
        (profit, edge, stDev, cards) => {
          expect({ profit, edge, stDev, ...cards }).toEqual({
            communityCards: cnToInt(['6c', 'Qh', '6d', '9h', 'Qc']),
            playerCards: cnToInt(['2d', '3c']),
            dealerCards: cnToInt(['7h', '9d']),
            profit: -2,
            edge: -2,
            stDev: 0
          });
          done();
        }
      );
    });

    it('should give 2 profit hidden two pair 1x post-river win, dealer qualifies, no blind pay', (done) => {
      binding.runUthSimulations(
        cnToInt(['6c', 'Qh', '9h', '2h', '3d', '2d', '3c', '7h', '9d']), 0, 1, 0, 0, 0,
        (profit, edge, stDev, cards) => {
          expect({ profit, edge, stDev, ...cards }).toEqual({
            communityCards: cnToInt(['6c', 'Qh', '9h', '2h', '3d']),
            playerCards: cnToInt(['2d', '3c']),
            dealerCards: cnToInt(['7h', '9d']),
            profit: 2,
            edge: 2,
            stDev: 0
          });
          done();
        }
      );
    });

    it('should give -2 profit three of a kind with three of a kind on board after turn/river fold, dealer qualifies, no blind pay', (done) => {
      binding.runUthSimulations(
        cnToInt(['6c', 'Qh', '6d', '9h', '6s', '2d', '3c', '7h', '9d']), 0, 1, 0, 0, 0,
        (profit, edge, stDev, cards) => {
          expect({ profit, edge, stDev, ...cards }).toEqual({
            communityCards: cnToInt(['6c', 'Qh', '6d', '9h', '6s']),
            playerCards: cnToInt(['2d', '3c']),
            dealerCards: cnToInt(['7h', '9d']),
            profit: -2,
            edge: -2,
            stDev: 0
          });
          done();
        }
      );
    });

    it('should give 2 profit hidden three of a kind 1x post-river win, dealer qualifies, no blind pay', (done) => {
      binding.runUthSimulations(
        cnToInt(['6c', 'Qh', '9h', '3h', '3d', '2d', '3c', '7h', '9d']), 0, 1, 0, 0, 0,
        (profit, edge, stDev, cards) => {
          expect({ profit, edge, stDev, ...cards }).toEqual({
            communityCards: cnToInt(['6c', 'Qh', '9h', '3h', '3d']),
            playerCards: cnToInt(['2d', '3c']),
            dealerCards: cnToInt(['7h', '9d']),
            profit: 2,
            edge: 2,
            stDev: 0
          });
          done();
        }
      );
    });

    it('should give -3 profit 1x post-river with 20 outs', (done) => {
      binding.runUthSimulations(
        cnToInt(['Ac', 'Kc', '6c', '6h', '7c', 'Qh', '2d', '3d', '4c']), 0, 1, 0, 0, 0,
        (profit, edge, stDev, cards) => {
          expect({ profit, edge, stDev, ...cards }).toEqual({
            communityCards: cnToInt(['Ac', 'Kc', '6c', '6h', '7c']),
            playerCards: cnToInt(['Qh', '2d']),
            dealerCards: cnToInt(['3d', '4c']),
            profit: -3,
            edge: -3,
            stDev: 0
          });
          done();
        }
      );
    });

    it('should give -2 profit post-river fold with 23 outs', (done) => {
      binding.runUthSimulations(
        cnToInt(['5c', '7h', '4d', '9s', '8d', 'Kc', '2h', 'Qd', '9d']), 0, 1, 0, 0, 0,
        (profit, edge, stDev, cards) => {
          expect({ profit, edge, stDev, ...cards }).toEqual({
            communityCards: cnToInt(['5c', '7h', '4d', '9s', '8d']),
            playerCards: cnToInt(['Kc', '2h']),
            dealerCards: cnToInt(['Qd', '9d']),
            profit: -2,
            edge: -2,
            stDev: 0
          });
          done();
        }
      );
    });

    it('should give -2 profit post-river fold, dealer doesnt qualify', (done) => {
      binding.runUthSimulations(
        cnToInt(['5c', '7h', '4d', '9s', '8d', 'Kc', '2h', 'Qd', '2d']), 0, 1, 0, 0, 0,
        (profit, edge, stDev, cards) => {
          expect({ profit, edge, stDev, ...cards }).toEqual({
            communityCards: cnToInt(['5c', '7h', '4d', '9s', '8d']),
            playerCards: cnToInt(['Kc', '2h']),
            dealerCards: cnToInt(['Qd', '2d']),
            profit: -2,
            edge: -2,
            stDev: 0
          });
          done();
        }
      );
    });
  });

});

describe('One flop card and one dealer card known', () => {
  describe('Preflop 4x rules', () => {
    it('should give 5 profit AA 4x preflop win, dealer qualifies, no blind pay', (done) => {
      binding.runUthSimulations(
        cnToInt(['9c', 'Th', '2c', '9d', 'Kc', 'Ac', 'Ad', '4c', '4d']), 0, 1, 1, 1, 0,
        (profit, edge, stDev, cards) => {
          expect({ profit, edge, stDev, ...cards }).toEqual({
            communityCards: cnToInt(['9c', 'Th', '2c', '9d', 'Kc']),
            playerCards: cnToInt(['Ac', 'Ad']),
            dealerCards: cnToInt(['4c', '4d']),
            profit: 5,
            edge: 5,
            stDev: 0
          });
          done();
        }
      );
    });

    it('should give 55 profit dealer card+ and 10+ 4x preflop win, dealer qualifies, straight flush blind pay', (done) => {
      binding.runUthSimulations(
        cnToInt(['Ah', '8d', '9d', '6d', '7d', '2h', 'Td', '2c', '9s']), 0, 1, 1, 1, 0,
        (profit, edge, stDev, cards) => {
          expect({ profit, edge, stDev, ...cards }).toEqual({
            communityCards: cnToInt(['Ah', '8d', '9d', '6d', '7d']),
            playerCards: cnToInt(['2h', 'Td']),
            dealerCards: cnToInt(['2c', '9s']),
            profit: 55,
            edge: 55,
            stDev: 0
          });
          done();
        }
      );
    });

    it('should give -2 profit dealer card+ and 10+, dealer pair, post-river fold, dealer qualifies, no blind pay', (done) => {
      binding.runUthSimulations(
        cnToInt(['2h', '8d', '9d', '6d', 'Kc', '3h', 'Td', '2c', '9s']), 0, 1, 1, 1, 0,
        (profit, edge, stDev, cards) => {
          expect({ profit, edge, stDev, ...cards }).toEqual({
            communityCards: cnToInt(['2h', '8d', '9d', '6d', 'Kc']),
            playerCards: cnToInt(['3h', 'Td']),
            dealerCards: cnToInt(['2c', '9s']),
            profit: -2,
            edge: -2,
            stDev: 0
          });
          done();
        }
      );
    });

    it('should give 3 profit dealer card+ and less than 10 2x postflop win, dealer qualifies, no blind pay', (done) => {
      binding.runUthSimulations(
        cnToInt(['Ah', '8d', '9h', '6d', '7d', '2h', '9d', '2c', '8s']), 0, 1, 1, 1, 0,
        (profit, edge, stDev, cards) => {
          expect({ profit, edge, stDev, ...cards }).toEqual({
            communityCards: cnToInt(['Ah', '8d', '9h', '6d', '7d']),
            playerCards: cnToInt(['2h', '9d']),
            dealerCards: cnToInt(['2c', '8s']),
            profit: 3,
            edge: 3,
            stDev: 0
          });
          done();
        }
      );
    });

    it('should give -6 profit pocket pair of dealer cards 4x preflop loss, dealer qualifies, no blind pay', (done) => {
      binding.runUthSimulations(
        cnToInt(['8c', '9s', 'Ac', 'Ah', '6s', '2h', '2s', '2c', 'Ad']), 0, 1, 1, 1, 0,
        (profit, edge, stDev, cards) => {
          expect({ profit, edge, stDev, ...cards }).toEqual({
            communityCards: cnToInt(['8c', '9s', 'Ac', 'Ah', '6s']),
            playerCards: cnToInt(['2h', '2s']),
            dealerCards: cnToInt(['2c', 'Ad']),
            profit: -6,
            edge: -6,
            stDev: 0
          });
          done();
        }
      );
    });

    it('should give -6 profit pocket pair of dealer cards or better 4x preflop loss, dealer qualifies, no blind pay', (done) => {
      binding.runUthSimulations(
        cnToInt(['8c', '9s', 'Ac', 'Ah', '6s', '3h', '3s', '2c', 'Ad']), 0, 1, 1, 1, 0,
        (profit, edge, stDev, cards) => {
          expect({ profit, edge, stDev, ...cards }).toEqual({
            communityCards: cnToInt(['8c', '9s', 'Ac', 'Ah', '6s']),
            playerCards: cnToInt(['3h', '3s']),
            dealerCards: cnToInt(['2c', 'Ad']),
            profit: -6,
            edge: -6,
            stDev: 0
          });
          done();
        }
      );
    });

    it('should give -6 profit 77+ 4x preflop loss, dealer qualifies, no blind pay', (done) => {
      binding.runUthSimulations(
        cnToInt(['3d', '7s', 'Qd', 'Js', 'As', '7h', '7c', 'Ks', '9s']), 0, 1, 1, 1, 0,
        (profit, edge, stDev, cards) => {
          expect({ profit, edge, stDev, ...cards }).toEqual({
            communityCards: cnToInt(['3d', '7s', 'Qd', 'Js', 'As']),
            playerCards: cnToInt(['7h', '7c']),
            dealerCards: cnToInt(['Ks', '9s']),
            profit: -6,
            edge: -6,
            stDev: 0
          });
          done();
        }
      );
    });

    it('should give -2 profit 77+ with dealer better pair post-river fold, dealer qualifies, no blind pay', (done) => {
      binding.runUthSimulations(
        cnToInt(['Kd', '3d', '8c', 'Js', 'As', '7h', '7s', 'Ks', '9s']), 0, 1, 1, 1, 0,
        (profit, edge, stDev, cards) => {
          expect({ profit, edge, stDev, ...cards }).toEqual({
            communityCards: cnToInt(['Kd', '3d', '8c', 'Js', 'As']),
            playerCards: cnToInt(['7h', '7s']),
            dealerCards: cnToInt(['Ks', '9s']),
            profit: -2,
            edge: -2,
            stDev: 0
          });
          done();
        }
      );
    });

    it('should give 6 profit 66- 2x postflop win, dealer qualifies, full house blind pay', (done) => {
      binding.runUthSimulations(
        cnToInt(['9h', '8d', '5c', '9c', '6h', '6c', '6d', '7s', '4h']), 0, 1, 1, 1, 0,
        (profit, edge, stDev, cards) => {
          expect({ profit, edge, stDev, ...cards }).toEqual({
            communityCards: cnToInt(['9h', '8d', '5c', '9c', '6h']),
            playerCards: cnToInt(['6c', '6d']),
            dealerCards: cnToInt(['7s', '4h']),
            profit: 6,
            edge: 6,
            stDev: 0
          });
          done();
        }
      );
    });

    it('should give 5 profit 66- 1x post-river win, dealer qualifies, full house blind pay', (done) => {
      binding.runUthSimulations(
        cnToInt(['9h', '8d', '5c', '9c', '6h', '6c', '6d', '9s', '4h']), 0, 1, 1, 1, 0,
        (profit, edge, stDev, cards) => {
          expect({ profit, edge, stDev, ...cards }).toEqual({
            communityCards: cnToInt(['9h', '8d', '5c', '9c', '6h']),
            playerCards: cnToInt(['6c', '6d']),
            dealerCards: cnToInt(['9s', '4h']),
            profit: 5,
            edge: 5,
            stDev: 0
          });
          done();
        }
      );
    });

    it('should give 4 profit hidden pair of 7s or better 4x preflop win, dealer doesnt qualify, no blind pay', (done) => {
      binding.runUthSimulations(
        cnToInt(['7s', '5d', 'Tc', '6d', '9d', '7h', '4c', 'As', '4d']), 0, 1, 1, 1, 0,
        (profit, edge, stDev, cards) => {
          expect({ profit, edge, stDev, ...cards }).toEqual({
            communityCards: cnToInt(['7s', '5d', 'Tc', '6d', '9d']),
            playerCards: cnToInt(['7h', '4c']),
            dealerCards: cnToInt(['As', '4d']),
            profit: 4,
            edge: 4,
            stDev: 0
          });
          done();
        }
      );
    });

    it('should give 4 profit hidden pair of 7s with T+ kicker, dealer pair of 7s or better 4x preflop win, dealer doesnt qualify, no blind pay', (done) => {
      binding.runUthSimulations(
        cnToInt(['7s', '5d', 'Th', '6d', '9d', '7h', 'Tc', '7c', '4d']), 0, 1, 1, 1, 0,
        (profit, edge, stDev, cards) => {
          expect({ profit, edge, stDev, ...cards }).toEqual({
            communityCards: cnToInt(['7s', '5d', 'Th', '6d', '9d']),
            playerCards: cnToInt(['7h', 'Tc']),
            dealerCards: cnToInt(['7c', '4d']),
            profit: 4,
            edge: 4,
            stDev: 0
          });
          done();
        }
      );
    });

    it('should give -2 profit hidden pair of 7s with 9- kicker, dealer pair of 7s or better post-river fold, dealer doesnt qualify, no blind pay', (done) => {
      binding.runUthSimulations(
        cnToInt(['7s', '5d', 'Th', '6d', '9d', '7h', '2c', '7c', '4d']), 0, 1, 1, 1, 0,
        (profit, edge, stDev, cards) => {
          expect({ profit, edge, stDev, ...cards }).toEqual({
            communityCards: cnToInt(['7s', '5d', 'Th', '6d', '9d']),
            playerCards: cnToInt(['7h', '2c']),
            dealerCards: cnToInt(['7c', '4d']),
            profit: -2,
            edge: -2,
            stDev: 0
          });
          done();
        }
      );
    });

    it('should give 2 profit hidden pair of 6s or worse 2x postflop win, dealer doesnt qualify, no blind pay', (done) => {
      binding.runUthSimulations(
        cnToInt(['6s', '5d', 'Tc', '7d', '9d', '6h', '4c', 'As', '4d']), 0, 1, 1, 1, 0,
        (profit, edge, stDev, cards) => {
          expect({ profit, edge, stDev, ...cards }).toEqual({
            communityCards: cnToInt(['6s', '5d', 'Tc', '7d', '9d']),
            playerCards: cnToInt(['6h', '4c']),
            dealerCards: cnToInt(['As', '4d']),
            profit: 2,
            edge: 2,
            stDev: 0
          });
          done();
        }
      );
    });

    it('should give 4 profit any pair with flop card better than dealer 4x preflop win, dealer doesnt qualify, no blind pay', (done) => {
      binding.runUthSimulations(
        cnToInt(['3c', '5d', 'Jd', '4c', 'Ks', '3h', '4c', '2s', 'Ts']), 0, 1, 1, 1, 0,
        (profit, edge, stDev, cards) => {
          expect({ profit, edge, stDev, ...cards }).toEqual({
            communityCards: cnToInt(['3c', '5d', 'Jd', '4c', 'Ks']),
            playerCards: cnToInt(['3h', '4c']),
            dealerCards: cnToInt(['2s', 'Ts']),
            profit: 4,
            edge: 4,
            stDev: 0
          });
          done();
        }
      );
    });

    it('should give -6 profit three to a flush with hidden J+ 4x preflop loss, dealer doesnt qualify, no blind pay', (done) => {
      binding.runUthSimulations(
        cnToInt(['4d', 'Kh', '6c', '8s', '3d', 'Jd', '2d', '8h', 'Td']), 0, 1, 1, 1, 0,
        (profit, edge, stDev, cards) => {
          expect({ profit, edge, stDev, ...cards }).toEqual({
            communityCards: cnToInt(['4d', 'Kh', '6c', '8s', '3d']),
            playerCards: cnToInt(['Jd', '2d']),
            dealerCards: cnToInt(['8h', 'Td']),
            profit: -6,
            edge: -6,
            stDev: 0
          });
          done();
        }
      );
    });

    it('should give -2 profit three to a flush with hidden T- post-river fold, dealer qualifies, no blind pay', (done) => {
      binding.runUthSimulations(
        cnToInt(['4d', 'Kh', '6c', '8s', '3d', 'Td', '2d', '8h', 'Jd']), 0, 1, 1, 1, 0,
        (profit, edge, stDev, cards) => {
          expect({ profit, edge, stDev, ...cards }).toEqual({
            communityCards: cnToInt(['4d', 'Kh', '6c', '8s', '3d']),
            playerCards: cnToInt(['Td', '2d']),
            dealerCards: cnToInt(['8h', 'Jd']),
            profit: -2,
            edge: -2,
            stDev: 0
          });
          done();
        }
      );
    });

    it('should give 5 profit Q8s+ vs J (x < D < Q) 4x preflop win, dealer qualifies, no blind pay', (done) => {
      binding.runUthSimulations(
        cnToInt(['Ac', 'Ah', 'Qc', 'Js', '9d', 'Qh', '8h', 'Jd', '5s']), 0, 1, 1, 1, 0,
        (profit, edge, stDev, cards) => {
          expect({ profit, edge, stDev, ...cards }).toEqual({
            communityCards: cnToInt(['Ac', 'Ah', 'Qc', 'Js', '9d']),
            playerCards: cnToInt(['Qh', '8h']),
            dealerCards: cnToInt(['Jd', '5s']),
            profit: 5,
            edge: 5,
            stDev: 0
          });
          done();
        }
      );
    });

    it('should give -4 profit Q8s+ vs J (x < D < Q) with dealer pair 2x postflop loss, dealer qualifies, no blind pay', (done) => {
      binding.runUthSimulations(
        cnToInt(['Jc', 'Ah', 'Qc', 'Js', '9d', 'Qh', '8h', 'Jd', '5s']), 0, 1, 1, 1, 0,
        (profit, edge, stDev, cards) => {
          expect({ profit, edge, stDev, ...cards }).toEqual({
            communityCards: cnToInt(['Jc', 'Ah', 'Qc', 'Js', '9d']),
            playerCards: cnToInt(['Qh', '8h']),
            dealerCards: cnToInt(['Jd', '5s']),
            profit: -4,
            edge: -4,
            stDev: 0
          });
          done();
        }
      );
    });

    it('should give -4 profit Q7s- vs J (x < D < Q) 2x postflop loss, dealer qualifies, no blind pay', (done) => {
      binding.runUthSimulations(
        cnToInt(['Ac', 'Jh', 'Qc', 'Js', '9d', 'Qh', '7h', 'Jd', '5s']), 0, 1, 1, 1, 0,
        (profit, edge, stDev, cards) => {
          expect({ profit, edge, stDev, ...cards }).toEqual({
            communityCards: cnToInt(['Ac', 'Jh', 'Qc', 'Js', '9d']),
            playerCards: cnToInt(['Qh', '7h']),
            dealerCards: cnToInt(['Jd', '5s']),
            profit: -4,
            edge: -4,
            stDev: 0
          });
          done();
        }
      );
    });

    it('should give -6 profit Q9s+ vs Q 4x preflop loss, dealer qualifies, no blind pay', (done) => {
      binding.runUthSimulations(
        cnToInt(['Tc', '4c', '3d', '5d', '5s', 'Qs', '9s', 'Qc', 'Kh']), 0, 1, 1, 1, 0,
        (profit, edge, stDev, cards) => {
          expect({ profit, edge, stDev, ...cards }).toEqual({
            communityCards: cnToInt(['Tc', '4c', '3d', '5d', '5s']),
            playerCards: cnToInt(['Qs', '9s']),
            dealerCards: cnToInt(['Qc', 'Kh']),
            profit: -6,
            edge: -6,
            stDev: 0
          });
          done();
        }
      );
    });

    it('should give -3 profit Q8s- vs Q 1x post-river loss, dealer qualifies, no blind pay', (done) => {
      binding.runUthSimulations(
        cnToInt(['Tc', '4c', '3d', '5d', '5s', 'Qs', '8s', 'Qc', 'Kh']), 0, 1, 1, 1, 0,
        (profit, edge, stDev, cards) => {
          expect({ profit, edge, stDev, ...cards }).toEqual({
            communityCards: cnToInt(['Tc', '4c', '3d', '5d', '5s']),
            playerCards: cnToInt(['Qs', '8s']),
            dealerCards: cnToInt(['Qc', 'Kh']),
            profit: -3,
            edge: -3,
            stDev: 0
          });
          done();
        }
      );
    });

    it('should give 6 profit QTo+ vs J (x < D < Q) 4x preflop win, dealer qualifies, straight blind pay', (done) => {
      binding.runUthSimulations(
        cnToInt(['Kh', 'Ah', 'Qc', 'Js', '9d', 'Qh', 'Tc', 'Jd', '5s']), 0, 1, 1, 1, 0,
        (profit, edge, stDev, cards) => {
          expect({ profit, edge, stDev, ...cards }).toEqual({
            communityCards: cnToInt(['Kh', 'Ah', 'Qc', 'Js', '9d']),
            playerCards: cnToInt(['Qh', 'Tc']),
            dealerCards: cnToInt(['Jd', '5s']),
            profit: 6,
            edge: 6,
            stDev: 0
          });
          done();
        }
      );
    });

    it('should give -6 profit QTo+ vs J (x < D < Q) with dealer pair 2x postflop loss, dealer qualifies, no blind pay', (done) => {
      binding.runUthSimulations(
        cnToInt(['Jh', 'Ah', 'Qc', 'Js', '9d', 'Qh', 'Tc', 'Jd', '5s']), 0, 1, 1, 1, 0,
        (profit, edge, stDev, cards) => {
          expect({ profit, edge, stDev, ...cards }).toEqual({
            communityCards: cnToInt(['Jh', 'Ah', 'Qc', 'Js', '9d']),
            playerCards: cnToInt(['Qh', 'Tc']),
            dealerCards: cnToInt(['Jd', '5s']),
            profit: -4,
            edge: -4,
            stDev: 0
          });
          done();
        }
      );
    });

    it('should give -4 profit Q9o- vs J (x < D < Q) 2x postflop loss, dealer qualifies, no blind pay', (done) => {
      binding.runUthSimulations(
        cnToInt(['Jh', 'Ah', 'Qc', 'Js', '9d', 'Qh', '9c', 'Jd', '5s']), 0, 1, 1, 1, 0,
        (profit, edge, stDev, cards) => {
          expect({ profit, edge, stDev, ...cards }).toEqual({
            communityCards: cnToInt(['Jh', 'Ah', 'Qc', 'Js', '9d']),
            playerCards: cnToInt(['Qh', '9c']),
            dealerCards: cnToInt(['Jd', '5s']),
            profit: -4,
            edge: -4,
            stDev: 0
          });
          done();
        }
      );
    });

    it('should give 5 profit QTo+ vs Q 4x preflop win, dealer qualifies, no blind pay', (done) => {
      binding.runUthSimulations(
        cnToInt(['Tc', '4c', '3d', '5d', '5s', 'Qs', 'Th', 'Qc', 'Kh']), 0, 1, 1, 1, 0,
        (profit, edge, stDev, cards) => {
          expect({ profit, edge, stDev, ...cards }).toEqual({
            communityCards: cnToInt(['Tc', '4c', '3d', '5d', '5s']),
            playerCards: cnToInt(['Qs', 'Th']),
            dealerCards: cnToInt(['Qc', 'Kh']),
            profit: 5,
            edge: 5,
            stDev: 0
          });
          done();
        }
      );
    });

    it('should give -3 profit Q9o- vs Q 1x post-river loss, dealer qualifies, no blind pay', (done) => {
      binding.runUthSimulations(
        cnToInt(['Tc', '4c', '3d', '5d', '5s', 'Qs', '9c', 'Qc', 'Kh']), 0, 1, 1, 1, 0,
        (profit, edge, stDev, cards) => {
          expect({ profit, edge, stDev, ...cards }).toEqual({
            communityCards: cnToInt(['Tc', '4c', '3d', '5d', '5s']),
            playerCards: cnToInt(['Qs', '9c']),
            dealerCards: cnToInt(['Qc', 'Kh']),
            profit: -3,
            edge: -3,
            stDev: 0
          });
          done();
        }
      );
    });

    it('should give 5 profit K6s+ vs Q (x < D < Q) 4x preflop win, dealer doesnt qualify, no blind pay', (done) => {
      binding.runUthSimulations(
        cnToInt(['9d', '3c', '8h', '2s', '4s', 'Kh', '6h', 'Qc', '7c']), 0, 1, 1, 1, 0,
        (profit, edge, stDev, cards) => {
          expect({ profit, edge, stDev, ...cards }).toEqual({
            communityCards: cnToInt(['9d', '3c', '8h', '2s', '4s']),
            playerCards: cnToInt(['Kh', '6h']),
            dealerCards: cnToInt(['Qc', '7c']),
            profit: 4,
            edge: 4,
            stDev: 0
          });
          done();
        }
      );
    });

    it('should give -2 profit K6s+ vs Q (x < D < Q) with delaher pair post-river fold, dealer doesnt qualify, no blind pay', (done) => {
      binding.runUthSimulations(
        cnToInt(['Qd', '3c', '8h', '2s', '4s', 'Kh', '6h', 'Qc', '7c']), 0, 1, 1, 1, 0,
        (profit, edge, stDev, cards) => {
          expect({ profit, edge, stDev, ...cards }).toEqual({
            communityCards: cnToInt(['Qd', '3c', '8h', '2s', '4s']),
            playerCards: cnToInt(['Kh', '6h']),
            dealerCards: cnToInt(['Qc', '7c']),
            profit: -2,
            edge: -2,
            stDev: 0
          });
          done();
        }
      );
    });

    it('should give -2 profit K5s- vs J (x < D < Q) post-river fold, dealer qualifies, no blind pay', (done) => {
      binding.runUthSimulations(
        cnToInt(['8h', '2s', 'Qd', '4c', '8s', 'Kc', '5c', 'Qc', '3d']), 0, 1, 1, 1, 0,
        (profit, edge, stDev, cards) => {
          expect({ profit, edge, stDev, ...cards }).toEqual({
            communityCards: cnToInt(['8h', '2s', 'Qd', '4c', '8s']),
            playerCards: cnToInt(['Kc', '5c']),
            dealerCards: cnToInt(['Qc', '3d']),
            profit: -2,
            edge: -2,
            stDev: 0
          });
          done();
        }
      );
    });

    it('should give 6.5 profit K9s+ vs K 4x preflop win, dealer qualifies, flush blind pay', (done) => {
      binding.runUthSimulations(
        cnToInt(['4h', '4d', 'Jd', '3s', '5d', 'Kd', '9d', 'Kh', 'As']), 0, 1, 1, 1, 0,
        (profit, edge, stDev, cards) => {
          expect({ profit, edge, stDev, ...cards }).toEqual({
            communityCards: cnToInt(['4h', '4d', 'Jd', '3s', '5d']),
            playerCards: cnToInt(['Kd', '9d']),
            dealerCards: cnToInt(['Kh', 'As']),
            profit: 6.5,
            edge: 6.5,
            stDev: 0
          });
          done();
        }
      );
    });

    it('should give 2 profit K8s- vs K 2x postflop win, dealer doesnt qualify, no blind pay', (done) => {
      binding.runUthSimulations(
        cnToInt(['Ah', '6s', '8d', 'Qc', '7s', 'Ks', '8s', 'Kc', '4c']), 0, 1, 1, 1, 0,
        (profit, edge, stDev, cards) => {
          expect({ profit, edge, stDev, ...cards }).toEqual({
            communityCards: cnToInt(['Ah', '6s', '8d', 'Qc', '7s']),
            playerCards: cnToInt(['Ks', '8s']),
            dealerCards: cnToInt(['Kc', '4c']),
            profit: 2,
            edge: 2,
            stDev: 0
          });
          done();
        }
      );
    });

    it('should give -6 profit KTo+ vs Q (x < D < Q) 4x preflop loss, dealer qualifies, no blind pay', (done) => {
      binding.runUthSimulations(
        cnToInt(['5h', 'Qh', '4s', '7s', '7d', 'Kc', 'Td', 'Qd', '7c']), 0, 1, 1, 1, 0,
        (profit, edge, stDev, cards) => {
          expect({ profit, edge, stDev, ...cards }).toEqual({
            communityCards: cnToInt(['5h', 'Qh', '4s', '7s', '7d']),
            playerCards: cnToInt(['Kc', 'Td']),
            dealerCards: cnToInt(['Qd', '7c']),
            profit: -6,
            edge: -6,
            stDev: 0
          });
          done();
        }
      );
    });

    it('should give -2 profit KTo+ vs Q (x < D < Q) with dealer pair post-river fold, dealer qualifies, no blind pay', (done) => {
      binding.runUthSimulations(
        cnToInt(['5h', 'Qh', '4s', '7s', '7d', 'Kc', 'Td', 'Qd', '7c']), 0, 1, 1, 1, 0,
        (profit, edge, stDev, cards) => {
          expect({ profit, edge, stDev, ...cards }).toEqual({
            communityCards: cnToInt(['Qc', 'Qh', '4s', '7s', '7d']),
            playerCards: cnToInt(['Kc', 'Td']),
            dealerCards: cnToInt(['Qd', '7c']),
            profit: -2,
            edge: -2,
            stDev: 0
          });
          done();
        }
      );
    });

    it('should give -3 profit K9o- vs Q (x < D < Q) 1x post-river loss, dealer qualifies, no blind pay', (done) => {
      binding.runUthSimulations(
        cnToInt(['8d', '5h', 'Js', '9h', '5c', 'Kh', '9d', 'Qc', 'Jh']), 0, 1, 1, 1, 0,
        (profit, edge, stDev, cards) => {
          expect({ profit, edge, stDev, ...cards }).toEqual({
            communityCards: cnToInt(['8d', '5h', 'Js', '9h', '5c']),
            playerCards: cnToInt(['Kh', '9d']),
            dealerCards: cnToInt(['Qc', 'Jh']),
            profit: -3,
            edge: -3,
            stDev: 0
          });
          done();
        }
      );
    });

    it('should give 4 profit KTo+ vs K 4x preflop win, dealer doesnt qualify, no blind pay', (done) => {
      binding.runUthSimulations(
        cnToInt(['Ah', '2s', '5d', '9c', 'Td', 'Kc', 'Ts', 'Kh', '4c']), 0, 1, 1, 1, 0,
        (profit, edge, stDev, cards) => {
          expect({ profit, edge, stDev, ...cards }).toEqual({
            communityCards: cnToInt(['Ah', '2s', '5d', '9c', 'Td']),
            playerCards: cnToInt(['Kc', 'Ts']),
            dealerCards: cnToInt(['Kh', '4c']),
            profit: 4,
            edge: 4,
            stDev: 0
          });
          done();
        }
      );
    });

    it('should give -3 profit K9o- vs K 1x post-riverloss, dealer qualifies, no blind pay', (done) => {
      binding.runUthSimulations(
        cnToInt(['6s', '5d', 'Jc', '2c', 'Jh', 'Kh', '9d', 'Kd', '5c']), 0, 1, 1, 1, 0,
        (profit, edge, stDev, cards) => {
          expect({ profit, edge, stDev, ...cards }).toEqual({
            communityCards: cnToInt(['6s', '5d', 'Jc', '2c', 'Jh']),
            playerCards: cnToInt(['Kh', '9d']),
            dealerCards: cnToInt(['Kd', '5c']),
            profit: -3,
            edge: -3,
            stDev: 0
          });
          done();
        }
      );
    });

    it('should give -6 profit A2s+ vs K (x < D < Q) 4x preflop loss, dealer qualifies, no blind pay', (done) => {
      binding.runUthSimulations(
        cnToInt(['Ts', 'Ks', 'Kc', 'Jh', '6h', 'Ac', '2c', 'Kh', 'Kd']), 0, 1, 1, 1, 0,
        (profit, edge, stDev, cards) => {
          expect({ profit, edge, stDev, ...cards }).toEqual({
            communityCards: cnToInt(['Ts', 'Ks', 'Kc', 'Jh', '6h']),
            playerCards: cnToInt(['Ac', '2c']),
            dealerCards: cnToInt(['Kh', 'Kd']),
            profit: -6,
            edge: -6,
            stDev: 0
          });
          done();
        }
      );
    });

    it('should give -2 profit A2s+ vs K (x < D < Q) post-river fold, dealer qualifies, no blind pay', (done) => {
      binding.runUthSimulations(
        cnToInt(['Ks', 'Ts', 'Kc', 'Jh', '6h', 'Ac', '2c', 'Kh', 'Kd']), 0, 1, 1, 1, 0,
        (profit, edge, stDev, cards) => {
          expect({ profit, edge, stDev, ...cards }).toEqual({
            communityCards: cnToInt(['Ks', 'Ts', 'Kc', 'Jh', '6h']),
            playerCards: cnToInt(['Ac', '2c']),
            dealerCards: cnToInt(['Kh', 'Kd']),
            profit: -2,
            edge: -2,
            stDev: 0
          });
          done();
        }
      );
    });

    it('should give -3 profit K2s vs K (x < D < Q) 1x post-river loss, dealer qualifies, no blind pay', (done) => {
      binding.runUthSimulations(
        cnToInt(['9s', '9c', '6h', 'Qc', '7s', 'Kh', '2h', 'Ks', '6c']), 0, 1, 1, 1, 0,
        (profit, edge, stDev, cards) => {
          expect({ profit, edge, stDev, ...cards }).toEqual({
            communityCards: cnToInt(['9s', '9c', '6h', 'Qc', '7s']),
            playerCards: cnToInt(['Kh', '2h']),
            dealerCards: cnToInt(['Ks', '6c']),
            profit: -3,
            edge: -3,
            stDev: 0
          });
          done();
        }
      );
    });

    it('should give -5 profit A9s+ vs A 4x preflop loss, dealer doesnt qualify, no blind pay', (done) => {
      binding.runUthSimulations(
        cnToInt(['8c', '6s', 'Kd', 'Th', '5c', 'Ad', '9d', 'Ac', 'Qh']), 0, 1, 1, 1, 0,
        (profit, edge, stDev, cards) => {
          expect({ profit, edge, stDev, ...cards }).toEqual({
            communityCards: cnToInt(['8c', '6s', 'Kd', 'Th', '5c']),
            playerCards: cnToInt(['Ad', '9d']),
            dealerCards: cnToInt(['Ac', 'Qh']),
            profit: -5,
            edge: -5,
            stDev: 0
          });
          done();
        }
      );
    });

    it('should give 3 profit A8s- vs A 1x post-river win, dealer qualifies, straight blind pay', (done) => {
      binding.runUthSimulations(
        cnToInt(['Qd', '9h', 'Js', 'Qs', 'Ts', 'Ah', '8h', 'Ad', '9c']), 0, 1, 1, 1, 0,
        (profit, edge, stDev, cards) => {
          expect({ profit, edge, stDev, ...cards }).toEqual({
            communityCards: cnToInt(['Qd', '9h', 'Js', 'Qs', 'Ts']),
            playerCards: cnToInt(['Ah', '8h']),
            dealerCards: cnToInt(['Ad', '9c']),
            profit: 3,
            edge: 3,
            stDev: 0
          });
          done();
        }
      );
    });

    it('should give 5 profit A7o+ vs K (x < D < Q) 4x preflop win, dealer qualifies, no blind pay', (done) => {
      binding.runUthSimulations(
        cnToInt(['6s', 'Ah', '2s', 'Kc', 'Td', 'Ac', '7d', 'Ks', '5d']), 0, 1, 1, 1, 0,
        (profit, edge, stDev, cards) => {
          expect({ profit, edge, stDev, ...cards }).toEqual({
            communityCards: cnToInt(['6s', 'Ah', '2s', 'Kc', 'Td']),
            playerCards: cnToInt(['Ac', '7d']),
            dealerCards: cnToInt(['Ks', '5d']),
            profit: 5,
            edge: 5,
            stDev: 0
          });
          done();
        }
      );
    });

    it('should give -4 profit A7o+ vs K (x < D < Q) with dealer pair 2x postflop loss, dealer qualifies, no blind pay', (done) => {
      binding.runUthSimulations(
        cnToInt(['Kd', 'Ah', '2s', 'Kc', 'Td', 'Ac', '7d', 'Ks', '5d']), 0, 1, 1, 1, 0,
        (profit, edge, stDev, cards) => {
          expect({ profit, edge, stDev, ...cards }).toEqual({
            communityCards: cnToInt(['Kd', 'Ah', '2s', 'Kc', 'Td']),
            playerCards: cnToInt(['Ac', '7d']),
            dealerCards: cnToInt(['Ks', '5d']),
            profit: -4,
            edge: -4,
            stDev: 0
          });
          done();
        }
      );
    });

    it('should give -3 profit A6o- vs K (x < D < Q) 1x post-river loss, dealer qualifies, no blind pay', (done) => {
      binding.runUthSimulations(
        cnToInt(['5s', 'Kd', 'Th', 'Jh', 'Qh', 'As', '6h', 'Kh', '5h']), 0, 1, 1, 1, 0,
        (profit, edge, stDev, cards) => {
          expect({ profit, edge, stDev, ...cards }).toEqual({
            communityCards: cnToInt(['5s', 'Kd', 'Th', 'Jh', 'Qh']),
            playerCards: cnToInt(['As', '6h']),
            dealerCards: cnToInt(['Kh', '5h']),
            profit: -3,
            edge: -3,
            stDev: 0
          });
          done();
        }
      );
    });

    it('should give -6 profit ATo+ vs A 4x preflop loss, dealer qualifies, no blind pay', (done) => {
      binding.runUthSimulations(
        cnToInt(['Qd', '9c', '4d', '5d', '7d', 'Ac', 'Td', 'Ad', '5c']), 0, 1, 1, 1, 0,
        (profit, edge, stDev, cards) => {
          expect({ profit, edge, stDev, ...cards }).toEqual({
            communityCards: cnToInt(['Qd', '9c', '4d', '5d', '7d']),
            playerCards: cnToInt(['Ac', 'Td']),
            dealerCards: cnToInt(['Ad', '5c']),
            profit: -6,
            edge: -6,
            stDev: 0
          });
          done();
        }
      );
    });

    it('should give -2 profit A9o- vs A 1x post-river fold, dealer qualifies, no blind pay', (done) => {
      binding.runUthSimulations(
        cnToInt(['3c', '6d', '2s', '8c', '7d', 'As', '9h', 'Ac', '8h']), 0, 1, 1, 1, 0,
        (profit, edge, stDev, cards) => {
          expect({ profit, edge, stDev, ...cards }).toEqual({
            communityCards: cnToInt(['3c', '6d', '2s', '8c', '7d']),
            playerCards: cnToInt(['As', '9h']),
            dealerCards: cnToInt(['Ac', '8h']),
            profit: -2,
            edge: -2,
            stDev: 0
          });
          done();
        }
      );
    });
  });

  describe('Postflop 2x rules', () => {
    it('should give 3 profit less than 12 bad outs 2x postflop win, dealer qualifies, no blind pay', (done) => {
      binding.runUthSimulations(
        cnToInt(['4c', '5c', '6c', '2c', '2s', '6d', '9h', '7h', '4d']), 0, 1, 1, 1, 0,
        (profit, edge, stDev, cards) => {
          expect({ profit, edge, stDev, ...cards }).toEqual({
            communityCards: cnToInt(['4c', '5c', '6c', '2c', '2s']),
            playerCards: cnToInt(['6d', '9h']),
            dealerCards: cnToInt(['7h', '4d']),
            profit: 3,
            edge: 3,
            stDev: 0
          });
          done();
        }
      );
    });

    it('should give 1 profit 12 bad outs post-river 1x post-river win, dealer doesnt qualify, no blind pay', (done) => {
      binding.runUthSimulations(
        cnToInt(['Kh', '6d', 'Qd', 'Td', '4h', '2h', '2d', '3c', '9s']), 0, 1, 1, 1, 0,
        (profit, edge, stDev, cards) => {
          expect({ profit, edge, stDev, ...cards }).toEqual({
            communityCards: cnToInt(['Kh', '6d', 'Qd', 'Td', '4h']),
            playerCards: cnToInt(['2h', '2d']),
            dealerCards: cnToInt(['3c', '9s']),
            profit: 1,
            edge: 1,
            stDev: 0
          });
          done();
        }
      );
    });
  });

  describe('Post-river 1x rules', () => {
    it('should give -3 profit at least 10 good outs 1x post-river loss, dealer qualifies, no blind pay', (done) => {
      binding.runUthSimulations(
        cnToInt(['5d', 'Ad', 'Qd', 'Ks', '6d', '7h', '8c', '3c', '3h']), 0, 1, 1, 1, 0,
        (profit, edge, stDev, cards) => {
          expect({ profit, edge, stDev, ...cards }).toEqual({
            communityCards: cnToInt(['5d', 'Ad', 'Qd', 'Ks', '6d']),
            playerCards: cnToInt(['7h', '8c']),
            dealerCards: cnToInt(['3c', '3h']),
            profit: -3,
            edge: -3,
            stDev: 0
          });
          done();
        }
      );
    });

    it('should give -2 profit less than 10 good outs post-river fold, dealer doesnt qualify, no blind pay', (done) => {
      binding.runUthSimulations(
        cnToInt(['Jc', 'As', '3c', '6h', 'Qc', '7c', '8h', '2c', '9d']), 0, 1, 1, 1, 0,
        (profit, edge, stDev, cards) => {
          expect({ profit, edge, stDev, ...cards }).toEqual({
            communityCards: cnToInt(['Jc', 'As', '3c', '6h', 'Qc']),
            playerCards: cnToInt(['7c', '8h']),
            dealerCards: cnToInt(['2c', '9d']),
            profit: -2,
            edge: -2,
            stDev: 0
          });
          done();
        }
      );
    });

    it('should give 0 profit at least 15 good outs if best case is push 1x post-river push, dealer doesnt qualify, no blind pay', (done) => {
      binding.runUthSimulations(
        cnToInt(['Ac', 'Kc', 'Qd', 'Jd', '7c', '5h', '6h', '5d', '2s']), 0, 1, 1, 1, 0,
        (profit, edge, stDev, cards) => {
          expect({ profit, edge, stDev, ...cards }).toEqual({
            communityCards: cnToInt(['Ac', 'Kc', 'Qd', 'Jd', '7c']),
            playerCards: cnToInt(['5h', '6h']),
            dealerCards: cnToInt(['5d', '2s']),
            profit: 0,
            edge: 0,
            stDev: 0
          });
          done();
        }
      );
    });

    it('should give -3 profit less than 15 good outs if best case is push post-river fold, dealer qualifies, no blind pay', (done) => {
      binding.runUthSimulations(
        cnToInt(['Ac', 'Ad', 'Qd', 'Qc', '6c', '5h', '6h', '5d', '8s']), 0, 1, 1, 1, 0,
        (profit, edge, stDev, cards) => {
          expect({ profit, edge, stDev, ...cards }).toEqual({
            communityCards: cnToInt(['Ac', 'Ad', 'Qd', 'Qc', '6c']),
            playerCards: cnToInt(['5h', '6h']),
            dealerCards: cnToInt(['5d', '8s']),
            profit: -3,
            edge: -3,
            stDev: 0
          });
          done();
        }
      );
    });
  });
});