
const NUM_CARDS_IN_DECK = 52;
const NUM_VALUES_IN_DECK = 13;
const NUM_SUITS_IN_DECK = 4;
const NUM_CARDS_IN_HAND = 5;
export const CARD_VALUES = '23456789TJQKA';
const ACE_VALUE = Math.pow(2, 13);
const STRAIGHT_LOW_ACE_INDICATOR = parseInt('10000000011110', 2);
const TEN_CARD_POSITION = 8;
const RANK_BASE_VALUE = Math.pow(10, 9);
const suitsLengthArray = new Array(NUM_SUITS_IN_DECK).fill(0);
const deckLengthArray = new Array(NUM_VALUES_IN_DECK).fill(0);
let filteredDeck: number[] | undefined;

export const buildDeck = (deadCards?: number[]): number[] => {
  if (!filteredDeck) {
    console.log('setting new filteredDeck');
    filteredDeck = Array.from(new Array(NUM_CARDS_IN_DECK), (_, index) => index)
      .filter(card => !deadCards?.includes(card));
  }
  const deck = filteredDeck.slice();
  const shuffledDeck: number[] = [];
  deck.forEach((card, index) => {
    shuffledDeck[index] = deck.splice(Math.floor(Math.random() * deck.length), 1)[0];
  });
  return shuffledDeck;
};

export const handDisplay = (hand: number[]) => {
  const values = CARD_VALUES;
  const suits = [`♣︎`, `♦︎`, `♥︎`, `♠︎`];
  const handString = hand
    .reduce((obj: string[], item) => {
      obj.push(
        `${values[item % NUM_VALUES_IN_DECK]}${suits[Math.floor(item / NUM_VALUES_IN_DECK)]
        }`
      );
      return obj;
    }, [])
    .join(' ');
  return handString;
};

export const rankHand = (hand: number[]) => {
  const suits = suitsLengthArray.slice();
  const values = deckLengthArray.slice();
  hand.forEach((card) => {
    suits[Math.floor(card / NUM_VALUES_IN_DECK)] += 1;
    values[card % NUM_VALUES_IN_DECK] += 1;
  });
  let rankValue: number = values.reduce(
    (total, val, index) =>
    (total +=
      ((val === 1 && Math.pow(2, index + 1)) || 0) +
      ((val > 1 && Math.pow(2, index + 1) * ACE_VALUE * val) || 0)),
    0
  );
  const firstCardIndex = values.findIndex((index) => index === 1);
  const flush = suits.some((count) => count === NUM_CARDS_IN_HAND);
  const straight = values
    .slice(firstCardIndex, firstCardIndex + NUM_CARDS_IN_HAND)
    .filter((count) => count === 1).length === 5 ||
    rankValue === STRAIGHT_LOW_ACE_INDICATOR;
  const straightFlush = straight && flush;
  const royalFlush = straightFlush && firstCardIndex === TEN_CARD_POSITION;
  let quads = false;
  let fullHouse = false;
  let trips = false;
  let twoPair = false;
  let pair = false;
  if (values.some((count) => count === 4)) {
    quads = true;
  } else if (values.filter(Boolean).length === 2) {
    fullHouse = true;
  } else if (values.some((count) => count === 3)) {
    trips = true;
  } else {
    const numberOfPairs = values.filter((count) => count === 2).length;
    if (numberOfPairs === 2) {
      twoPair = true;
    } else if (numberOfPairs === 1) {
      pair = true;
    }
  }
  const ranks = {
    royalFlush,
    straightFlush,
    quads,
    fullHouse,
    flush,
    straight,
    trips,
    twoPair,
    pair,
    highCard: true,
  };
  let rankIndex = 0;
  // let rankDescription = '';
  const handRankIndex = Object.keys(ranks).findIndex(key => ranks[key as keyof typeof ranks]);
  rankIndex = 10 - handRankIndex;
  rankValue +=
    rankIndex * RANK_BASE_VALUE -
    ((rankValue === STRAIGHT_LOW_ACE_INDICATOR && ACE_VALUE - 1) || 0);
  // rankDescription = rankDescription
  //   .split('_')
  //   .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
  //   .join(' ');
  // rankHandPerformance += (window.performance.now() - start);
  return rankValue;
  // return {
  //   hand,
  //   suits,
  //   values,
  //   rankValue,
  //   ranks,
  //   rankDescription,
  //   display: handDisplay(hand),
  // };
};

export const compareHands = (hands: number[][]) => {
  const comparedHands = Math.max(...hands.map((hand) => rankHand(hand)));
  // .sort((handA, handB) => handB.rankValue - handA.rankValue);
  return comparedHands;
};

export const dealCards = (
  numPlayers: number,
  numCardsPerPlayer: number,
  holeCards?: { [key: number]: number[] },
  currentBoard?: number[]
) => {
  let start = window.performance.now();
  let deadCards: number[] = [];
  if (holeCards) {
    Object.keys(holeCards).map(Number)
      .forEach(playerNumber => deadCards = deadCards.concat(holeCards[playerNumber]));
  }
  if (currentBoard) {
    deadCards = deadCards.concat(currentBoard);
  }
  const deck = buildDeck(deadCards);
  start = window.performance.now();
  const table: number[][] = Array.from(new Array(numPlayers), () => []);
  const board = [];
  if (holeCards) {
    Object.keys(holeCards).map(Number)
      .forEach(playerNumber => {
        const playerHoleCards = holeCards[playerNumber].slice();
        const numCardsToGivePlayer = numCardsPerPlayer - playerHoleCards.length;
        Array.from({ length: numCardsToGivePlayer }).forEach(() => {
          playerHoleCards.push(deck.pop() as number);
        });
        table[playerNumber] = playerHoleCards;
      });
  } else {
    for (let card = 0; card < numCardsPerPlayer; card += 1) {
      for (let player = 0; player < numPlayers; player += 1) {
        const lastCard = deck.pop();
        if (lastCard) {
          table[player].push(lastCard);
        }
      }
    }
  }
  if (currentBoard && currentBoard.length > 2) {
    board.push(currentBoard[0]);
    board.push(currentBoard[1]);
    board.push(currentBoard[2]);
  } else {
    deck.pop();
    board.push(deck.pop());
    board.push(deck.pop());
    board.push(deck.pop());
  }
  if (currentBoard && currentBoard.length > 3) {
    board.push(currentBoard[3]);
  } else {
    deck.pop();
    board.push(deck.pop());
  }
  if (currentBoard && currentBoard.length > 4) {
    board.push(currentBoard[4]);
  } else {
    deck.pop();
    board.push(deck.pop());
  }
  return {
    table,
    board: board as number[],
  };
};

export const findBestHandTexasHoldEm = (holeCards: number[], board: number[]) => {
  const hands = [];
  hands.push(board);
  for (let c = 0; c < 2; c += 1) {
    for (let b = 0; b < 5; b += 1) {
      const newHand = [...board];
      newHand[b] = holeCards[c];
      hands.push(newHand);
    }
  }
  for (let b = 0; b < 4; b += 1) {
    for (let r = b + 1; r < 5; r += 1) {
      const newHand = [...board];
      newHand[b] = holeCards[0];
      newHand[r] = holeCards[1];
      hands.push(newHand);
    }
  }
  return compareHands(hands);
};

export const dealRound = ({ numPlayers, numCardsPerPlayer, holeCards, currentBoard }:
  {
    numPlayers: number, numCardsPerPlayer: number, holeCards?: { [key: number]: number[] },
    currentBoard?: number[]
  }) => {
  let start = window.performance.now();
  const game = dealCards(numPlayers, numCardsPerPlayer, holeCards, currentBoard);
  const players = game.table.map((hole, index) => {
    return {
      name: `Player ${index + 1}`,
      hole,
      board: game.board,
      bestHand: 0,
    };
  });
  players.forEach((player) => {
    player.bestHand = findBestHandTexasHoldEm(player.hole, game.board);
    // player.board = handDisplay(player.board) as any;
    // player.hole = handDisplay(player.hole) as any;
  });
  start = window.performance.now();
  const rankPlayers = players.sort(
    (a, b) => b.bestHand - a.bestHand
  );
  return rankPlayers;
};

export const dealTexasHoldEm = (
  numPlayers: number,
  resetFilteredDeck: boolean,
  holeCards?: { [key: number]: number[] },
  currentBoard?: number[]
) => {
  if (resetFilteredDeck) {
    filteredDeck = undefined;
  }
  const round = dealRound({
    numPlayers,
    numCardsPerPlayer: 2,
    holeCards,
    currentBoard
  });
  return round;
};
