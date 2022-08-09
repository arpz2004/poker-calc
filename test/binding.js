'use strict';

const assert = require('assert');
const binding = require("bindings")("native");

// Base test
assert.deepStrictEqual(binding.runUthSimulations([
  1, 2, 3, 4, 5, 6, 7, 8,
  9, 10, 11, 12, 13, 14, 15,
  16, 17, 18, 19, 20, 21, 22,
  23, 24, 25, 26, 27, 28, 29,
  30, 31, 32, 33, 34, 35, 36,
  37, 38, 39, 40, 41, 42, 43,
  44, 45, 46, 47, 48, 49, 50,
  51, 52
]), {
  playerCards: [6, 7],
  communityCards: [1, 2, 3, 4, 5],
  dealerCards: [8, 9],
  equity: -6
});

// Using only the 9 dealt cards
assert.deepStrictEqual(binding.runUthSimulations([
  1, 2, 3, 4, 5, 6, 7, 8, 9
]), {
  playerCards: [6, 7],
  communityCards: [1, 2, 3, 4, 5],
  dealerCards: [8, 9],
  equity: -6
});

// Changing a card gives different result
assert.notDeepStrictEqual(binding.runUthSimulations([
  10, 2, 3, 4, 5, 6, 7, 8, 9
]), {
  playerCards: [6, 7],
  communityCards: [1, 2, 3, 4, 5],
  dealerCards: [8, 9],
  equity: -6
});
