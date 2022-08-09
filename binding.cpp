#include <napi.h>
#include <iostream>
#include <cstring>
#include <iterator>
#include <numeric>
#include <vector>
#include <algorithm>
#include <random>
#include "omp.h"

#define DWORD int32_t

using namespace Napi;
using namespace std;

const int ROYAL_FLUSH = 36874;

// The handranks lookup table- loaded from HANDRANKS.DAT.
int HR[32487834];

auto rng = std::default_random_engine{std::random_device{}()};

void print(std::vector<int> const &input)
{
  std::copy(input.begin(),
            input.end(),
            std::ostream_iterator<int>(std::cout, " "));
}

void printError(std::vector<int> const &input)
{
  std::copy(input.begin(),
            input.end(),
            std::ostream_iterator<int>(std::cerr, " "));
}

// This function isn't currently used, but shows how you lookup
// a 7-card poker hand. pCards should be a pointer to an array
// of 7 integers each with value between 1 and 52 inclusive.
int LookupHand(vector<int> cards)
{
  int p = HR[53 + cards[0]];
  p = HR[p + cards[1]];
  p = HR[p + cards[2]];
  p = HR[p + cards[3]];
  p = HR[p + cards[4]];
  p = HR[p + cards[5]];
  return HR[p + cards[6]];
}

int FiveCardLookup(vector<int> cards)
{
  int p = HR[53 + cards[0]];
  p = HR[p + cards[1]];
  p = HR[p + cards[2]];
  p = HR[p + cards[3]];
  p = HR[p + cards[4]];
  return HR[p];
}

int SixCardLookup(vector<int> cards)
{
  int p = HR[53 + cards[0]];
  p = HR[p + cards[1]];
  p = HR[p + cards[2]];
  p = HR[p + cards[3]];
  p = HR[p + cards[4]];
  p = HR[p + cards[5]];
  return HR[p];
}

struct c_unique
{
  int current;
  c_unique() { current = 0; }
  int operator()() { return ++current; }
} UniqueNumber;

float getBlindBetPayTable(int handRank)
{
  float multiplier = 0;
  int handType = handRank >> 12;
  switch (handType)
  {
  case 5:
    multiplier = 1;
    break;
  case 6:
    multiplier = 1.5f;
    break;
  case 7:
    multiplier = 3;
    break;
  case 8:
    multiplier = 10;
    break;
  case 9:
    if (handRank == ROYAL_FLUSH)
    {
      multiplier = 500;
    }
    else
    {
      multiplier = 50;
    }
    break;
  }
  return multiplier;
}

bool isUnique(vector<int> &x)
{
  sort(x.begin(), x.end());
  return adjacent_find(x.begin(), x.end()) == x.end();
}

template <class T, class Func>
auto Map(const std::vector<T> &input_array, Func op)
{
  std::vector<int> result_array;
  std::transform(input_array.begin(), input_array.end(), std::back_inserter(result_array), op);
  return result_array;
}

int getOuts(vector<int> hand, vector<int> communityCards)
{
  vector<int> currentHand;
  currentHand.insert(currentHand.end(), hand.begin(), hand.end());
  currentHand.insert(currentHand.end(), communityCards.begin(), communityCards.end());
  int dealerOuts = 0;
  for (int i = 1; i <= 52; i++)
  {
    if (!(find(currentHand.begin(), currentHand.end(), i) != currentHand.end()))
    {
      vector<int> dealerHand;
      dealerHand.insert(dealerHand.end(), communityCards.begin(), communityCards.end());
      dealerHand.insert(dealerHand.end(), i);
      if (SixCardLookup(dealerHand) > LookupHand(currentHand))
      {
        dealerOuts++;
      }
    }
  }
  return dealerOuts;
}

int getPlayBet(vector<int> playerHand, vector<int> communityCards, vector<int> knownFlopCards, vector<int> knownDealerCards)
{
  int playBet = 0;
  // Basic Strategy
  if (knownFlopCards.size() == 0 && knownDealerCards.size() == 0)
  {
    vector<int> flop;
    flop.insert(flop.end(), communityCards.begin(), communityCards.end() - 2);
    vector<int> postFlopHand;
    postFlopHand.insert(postFlopHand.end(), playerHand.begin(), playerHand.end());
    postFlopHand.insert(postFlopHand.end(), flop.begin(), flop.end());
    vector<int> postRiverHand;
    postRiverHand.insert(postRiverHand.end(), playerHand.begin(), playerHand.end());
    postRiverHand.insert(postRiverHand.end(), communityCards.begin(), communityCards.end());
    vector<int> cardValues = Map(postFlopHand, [](int value)
                                 { return (value - 1) / 4; });
    vector<int> suitValues = Map(postFlopHand, [](int value)
                                 { return value % 4; });
    vector<int> flopCardValues = Map(flop, [](int value)
                                     { return (value - 1) / 4; });
    vector<int> communityCardValues = Map(communityCards, [](int value)
                                          { return (value - 1) / 4; });
    vector<int> sortedSuitValues;
    sortedSuitValues.insert(sortedSuitValues.end(), suitValues.begin(), suitValues.end());
    sort(sortedSuitValues.begin(), sortedSuitValues.end());
    // Preflop
    if (
        // Ax
        playerHand[0] >= 49 || playerHand[1] >= 49 ||
        // K2s+, K5+
        (playerHand[0] >= 45 && (playerHand[1] >= 13 || (playerHand[0] - playerHand[1]) % 4 == 0)) ||
        (playerHand[1] >= 45 && (playerHand[0] >= 13 || (playerHand[1] - playerHand[0]) % 4 == 0)) ||
        // Q6s+, Q8+
        (playerHand[0] >= 41 && (playerHand[1] >= 25 || (playerHand[1] >= 17 && (playerHand[0] - playerHand[1]) % 4 == 0))) ||
        (playerHand[1] >= 41 && (playerHand[0] >= 25 || (playerHand[0] >= 17 && (playerHand[1] - playerHand[0]) % 4 == 0))) ||
        // J8s+, JT+
        (playerHand[0] >= 37 && (playerHand[1] >= 33 || (playerHand[1] >= 25 && (playerHand[0] - playerHand[1]) % 4 == 0))) ||
        (playerHand[1] >= 37 && (playerHand[0] >= 33 || (playerHand[0] >= 25 && (playerHand[1] - playerHand[0]) % 4 == 0))) ||
        // 33+
        ((playerHand[0] - 1) / 4 == (playerHand[1] - 1) / 4 && playerHand[0] >= 5))
    {
      playBet = 4;
    }
    // Postflop
    else if (
        // Two pair or better
        FiveCardLookup(postFlopHand) >> 12 >= 3 ||
        // Hidden pair except pocket deuces
        (FiveCardLookup(postFlopHand) >> 12 == 2 && !((playerHand[0] - 1) / 4 == 0 && (playerHand[1] - 1) / 4 == 0) && isUnique(flopCardValues)) ||
        // Four to a flush including a hidden 10 or better
        ((sortedSuitValues[1] == sortedSuitValues[4] || sortedSuitValues[0] == sortedSuitValues[3]) &&
         ((sortedSuitValues[2] == suitValues[0] && cardValues[0] >= 33) || (sortedSuitValues[2] == suitValues[1] && cardValues[1] >= 33))))
    {
      playBet = 2;
    }
    // Post-river
    else if (
        // Hidden pair or better
        LookupHand(postRiverHand) >> 12 >= 3 ||
        (LookupHand(postRiverHand) >> 12 == 2 && isUnique(communityCardValues)) ||
        // Less than 21 dealer outs
        getOuts(playerHand, communityCards) < 21)
    {
      playBet = 1;
    }
  }
  return playBet;
}

float calculateProfitUTH(vector<int> deck)
{
  vector<int> communityCards;
  communityCards.insert(communityCards.end(), deck.begin(), deck.begin() + 5);
  vector<int> playerCards;
  playerCards.insert(playerCards.end(), deck.begin() + 5, deck.begin() + 7);
  vector<int> dealerCards;
  dealerCards.insert(dealerCards.end(), deck.begin() + 7, deck.begin() + 9);
  vector<int> playerHand;
  playerHand.insert(playerHand.end(), playerCards.begin(), playerCards.end());
  playerHand.insert(playerHand.end(), communityCards.begin(), communityCards.end());
  vector<int> dealerHand;
  dealerHand.insert(dealerHand.end(), dealerCards.begin(), dealerCards.end());
  dealerHand.insert(dealerHand.end(), communityCards.begin(), communityCards.end());
  vector<int> knownFlopCards;
  vector<int> knownDealerCards;
  int playBet = getPlayBet(playerCards, communityCards, knownFlopCards, knownDealerCards);
  float profit = 0;
  int playerHandRank = LookupHand(playerHand);
  int dealerHandRank = LookupHand(dealerHand);
  if (playerHandRank > dealerHandRank && playBet > 0)
  {
    // Ante bet
    if (dealerHandRank >> 12 > 1)
    {
      profit += 1;
    }
    // Play bet
    profit += playBet;
    // Blind bet
    profit += getBlindBetPayTable(playerHandRank);
  }
  else if (playerHandRank < dealerHandRank || playBet == 0)
  {
    // Ante bet
    if (dealerHandRank >> 12 > 1)
    {
      profit -= 1;
    }
    // Play bet
    profit -= playBet;
    // Blind bet
    profit -= 1;
  }
  return profit;
}

Value RunUthSimulations(const CallbackInfo &info)
{
  Array deckArray = info[0].As<Array>();
  vector<int> deck;

  // Load the HandRanks.DAT file and map it into the HR array
  memset(HR, 0, sizeof(HR));
  FILE *fin = fopen("HandRanks.dat", "rb");
  if (!fin)
    return String::New(info.Env(), "fin");
  size_t bytesread = fread(HR, sizeof(HR), 1, fin); // get the HandRank Array
  std::fclose(fin);

  float profit = 0;
  int numberOfSimulations = 1;
  if (deckArray.Length() > 0)
  {
    numberOfSimulations = 1;
    for (size_t i = 0; i < deckArray.Length(); i++)
    {
      int value = (int)deckArray.Get(i).As<Number>();
      deck.push_back(value);
    }
    profit += calculateProfitUTH(deck);
  }
  else
  {

    for (int i = 0; i < numberOfSimulations; i++)
    {
      deck = {1, 2, 3, 4, 5, 6, 7, 8,
              9, 10, 11, 12, 13, 14, 15,
              16, 17, 18, 19, 20, 21, 22,
              23, 24, 25, 26, 27, 28, 29,
              30, 31, 32, 33, 34, 35, 36,
              37, 38, 39, 40, 41, 42, 43,
              44, 45, 46, 47, 48, 49, 50,
              51, 52};
      std::shuffle(std::begin(deck), std::end(deck), rng);
      profit += calculateProfitUTH(deck);
    }
  }
  float equity = profit / (float)numberOfSimulations;
  cout << "\nProfit is:\n"
       << profit << "\nEquity is:\n"
       << equity;
  vector<int> communityCards;
  communityCards.insert(communityCards.end(), deck.begin(), deck.begin() + 5);
  vector<int> playerCards;
  playerCards.insert(playerCards.end(), deck.begin() + 5, deck.begin() + 7);
  vector<int> dealerCards;
  dealerCards.insert(dealerCards.end(), deck.begin() + 7, deck.begin() + 9);
  vector<int> playerHand;
  playerHand.insert(playerHand.end(), playerCards.begin(), playerCards.end());
  playerHand.insert(playerHand.end(), communityCards.begin(), communityCards.end());
  vector<int> dealerHand;
  dealerHand.insert(dealerHand.end(), dealerCards.begin(), dealerCards.end());
  dealerHand.insert(dealerHand.end(), communityCards.begin(), communityCards.end());

  Napi::Array playerCardsArr = Napi::Array::New(info.Env(), playerCards.size());
  uint32_t j = 0;
  for (auto &&it : playerCards)
  {
    playerCardsArr[j++] = Number::New(info.Env(), it);
  }
  Napi::Array communityCardsArr = Napi::Array::New(info.Env(), communityCards.size());
  j = 0;
  for (auto &&it : communityCards)
  {
    communityCardsArr[j++] = Number::New(info.Env(), it);
  }
  Napi::Array dealerCardsArr = Napi::Array::New(info.Env(), dealerCards.size());
  j = 0;
  for (auto &&it : dealerCards)
  {
    dealerCardsArr[j++] = Number::New(info.Env(), it);
  }
  Env env = info.Env();
  Object obj = Object::New(env);
  obj.Set("playerCards", playerCardsArr);
  obj.Set("communityCards", communityCardsArr);
  obj.Set("dealerCards", dealerCardsArr);
  obj.Set("equity", equity);
  return obj;
}

Napi::Object Init(Napi::Env env, Napi::Object exports)
{
  exports.Set("runUthSimulations", Function::New(env, RunUthSimulations));
  return exports;
}

NODE_API_MODULE(addon, Init)
