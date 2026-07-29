#include <napi.h>
#include <iostream>
#include <random>
#include <numeric>
#include <atomic>
#include "omp.h"
#include <cstdint>

using namespace Napi;
using namespace std;

#define DWORD int32_t

const int ROYAL_FLUSH = 36874;

// The handranks lookup table- loaded from HANDRANKS.DAT.
// Align to 64-byte boundary for better cache utilization
__declspec(align(64)) int HR[32487834];
bool HR_loaded = false;



auto rng = std::default_random_engine{std::random_device{}()};
int64_t currentSimulationNumber;
int64_t numberOfSimulations;
std::atomic<int64_t> atomicCurrentSimulationNumber{0}; // Thread-safe progress counter



// Pre-allocated deck array to avoid reallocation
const int baseDeck[52] = {1, 2, 3, 4, 5, 6, 7, 8,
                          9, 10, 11, 12, 13, 14, 15,
                          16, 17, 18, 19, 20, 21, 22,
                          23, 24, 25, 26, 27, 28, 29,
                          30, 31, 32, 33, 34, 35, 36,
                          37, 38, 39, 40, 41, 42, 43,
                          44, 45, 46, 47, 48, 49, 50,
                          51, 52};

// Load HR array once and cache it
bool loadHandRanks()
{
  if (HR_loaded)
    return true;
  
  memset(HR, 0, sizeof(HR));
  FILE *fin = fopen("HandRanks.dat", "rb");
  if (!fin)
    return false;
  size_t bytesread = fread(HR, sizeof(HR), 1, fin);
  std::fclose(fin);
  HR_loaded = true;
  return true;
}

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

// Optimized version using raw array pointer for better performance
__forceinline int LookupHandFast(const int* cards)
{
  int p = HR[53 + cards[0]];
  p = HR[p + cards[1]];
  p = HR[p + cards[2]];
  p = HR[p + cards[3]];
  p = HR[p + cards[4]];
  p = HR[p + cards[5]];
  return HR[p + cards[6]];
}



__forceinline int FiveCardLookupFast(const int* cards)
{
  int p = HR[53 + cards[0]];
  p = HR[p + cards[1]];
  p = HR[p + cards[2]];
  p = HR[p + cards[3]];
  p = HR[p + cards[4]];
  return HR[p];
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

__forceinline int SixCardLookupFast(const int* cards)
{
  int p = HR[53 + cards[0]];
  p = HR[p + cards[1]];
  p = HR[p + cards[2]];
  p = HR[p + cards[3]];
  p = HR[p + cards[4]];
  p = HR[p + cards[5]];
  return HR[p];
}

double getBlindBetPayTable(int handRank)
{
  double multiplier = 0;
  int handType = handRank >> 12;
  switch (handType)
  {
  case 5:
    multiplier = 1;
    break;
  case 6:
    multiplier = 1.5;
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

int getBadOuts(vector<int> hand, vector<int> communityCards, int maxOuts)
{
  // Optimized version with reduced allocations and better card checking
  int handSize = hand.size();
  int communitySize = communityCards.size();
  int currentHandSize = handSize + communitySize;
  
  // Pre-allocate currentHand and dealerHand to avoid repeated allocations
  vector<int> currentHand(currentHandSize);
  vector<int> dealerHand(communitySize + 1);
  
  // Build currentHand once
  for (int i = 0; i < handSize; i++) currentHand[i] = hand[i];
  for (int i = 0; i < communitySize; i++) currentHand[handSize + i] = communityCards[i];
  
  // Build dealerHand base once
  for (int i = 0; i < communitySize; i++) dealerHand[i] = communityCards[i];
  
  // Optimized card existence checking with boolean array
  bool cardExists[53] = {false};
  for (int i = 0; i < currentHandSize; i++) {
    cardExists[currentHand[i]] = true;
  }
  
  int dealerOuts = 0;
  int currentHandRank = LookupHandFast(currentHand.data());
  
  for (int i = 1; i <= 52; i++)
  {
    if (!cardExists[i])
    {
      dealerHand[communitySize] = i;
      if (SixCardLookup(dealerHand) > currentHandRank)
      {
        dealerOuts++;
        if (dealerOuts >= maxOuts)
        {
          break;
        }
      }
    }
  }
  return dealerOuts;
}

int getBadOutsFlop(vector<int> hand, vector<int> flop, vector<int> knownDealerCards, int maxOuts)
{
  // Optimized version with reduced allocations and better card checking
  int handSize = hand.size();
  int flopSize = flop.size();
  int knownDealerSize = knownDealerCards.size();
  int currentHandSize = handSize + flopSize;
  
  // Pre-allocate to avoid repeated allocations
  vector<int> currentHand(currentHandSize + 1); // +1 for potential extension
  vector<int> dealerHand(flopSize + knownDealerSize + 1);
  
  // Build currentHand once
  for (int i = 0; i < handSize; i++) currentHand[i] = hand[i];
  for (int i = 0; i < flopSize; i++) currentHand[handSize + i] = flop[i];
  
  // Build dealerHand base once
  for (int i = 0; i < flopSize; i++) dealerHand[i] = flop[i];
  for (int i = 0; i < knownDealerSize; i++) dealerHand[flopSize + i] = knownDealerCards[i];
  
  // Optimized card existence checking with boolean array
  bool cardExists[53] = {false};
  for (int i = 0; i < currentHandSize; i++) {
    cardExists[currentHand[i]] = true;
  }
  for (int i = 0; i < knownDealerSize; i++) {
    cardExists[knownDealerCards[i]] = true;
  }
  
  int dealerOuts = 0;
  int currentHandRank = FiveCardLookupFast(currentHand.data());
  
  for (int i = 1; i <= 52; i++)
  {
    if (!cardExists[i])
    {
      dealerHand[flopSize + knownDealerSize] = i;
      int dealerHandSize = flopSize + knownDealerSize + 1;
      
      if (dealerHandSize == 6)
      {
        currentHand[currentHandSize] = i;
        int currentHandRank6 = LookupHandFast(currentHand.data());
        if (SixCardLookup(dealerHand) > currentHandRank6)
        {
          dealerOuts++;
          if (dealerOuts >= maxOuts) break;
        }
      }
      else if (FiveCardLookupFast(dealerHand.data()) > currentHandRank)
      {
        dealerOuts++;
        if (dealerOuts >= maxOuts) break;
      }
    }
  }
  return dealerOuts;
}

int getGoodOuts(vector<int> hand, vector<int> communityCards, int knownDealerCard, int maxOuts, bool push = false)
{
  // Optimized version with reduced allocations and better card checking
  int handSize = hand.size();
  int communitySize = communityCards.size();
  int currentHandSize = handSize + communitySize;
  
  // Pre-allocate to avoid repeated allocations
  vector<int> currentHand(currentHandSize);
  vector<int> dealerHand(communitySize + 2); // +2 for knownDealerCard and candidate card
  
  // Build currentHand once
  for (int i = 0; i < handSize; i++) currentHand[i] = hand[i];
  for (int i = 0; i < communitySize; i++) currentHand[handSize + i] = communityCards[i];
  
  // Build dealerHand base once
  for (int i = 0; i < communitySize; i++) dealerHand[i] = communityCards[i];
  dealerHand[communitySize] = knownDealerCard;
  
  // Optimized card existence checking with boolean array
  bool cardExists[53] = {false};
  for (int i = 0; i < currentHandSize; i++) {
    cardExists[currentHand[i]] = true;
  }
  cardExists[knownDealerCard] = true;
  
  int goodOuts = 0;
  int currentHandRank = LookupHandFast(currentHand.data());
  
  for (int i = 1; i <= 52; i++)
  {
    if (!cardExists[i])
    {
      dealerHand[communitySize + 1] = i;
      int dealerHandRank = LookupHandFast(dealerHand.data());
      
      if (currentHandRank > dealerHandRank)
      {
        goodOuts++;
      }
      else if (push && currentHandRank == dealerHandRank)
      {
        goodOuts++;
      }
      if (goodOuts >= maxOuts)
      {
        break;
      }
    }
  }
  return goodOuts;
}

int getPlayBet(vector<int> playerHand, vector<int> communityCards, vector<int> dealerCards, int knownDealerCards, int knownFlopCards, int knownTurnRiverCards, bool excludeFishyPlays)
{
  int playBet = 0;
  vector<int> flop;
  flop.insert(flop.end(), communityCards.begin(), communityCards.end() - 2);
  vector<int> postFlopHand;
  postFlopHand.insert(postFlopHand.end(), playerHand.begin(), playerHand.end());
  postFlopHand.insert(postFlopHand.end(), flop.begin(), flop.end());
  vector<int> postRiverHand;
  postRiverHand.insert(postRiverHand.end(), playerHand.begin(), playerHand.end());
  postRiverHand.insert(postRiverHand.end(), communityCards.begin(), communityCards.end());
  vector<int> playerCardValues = Map(playerHand, [](int value)
                                     { return (value - 1) / 4; });
  vector<int> playerSuitValues = Map(playerHand, [](int value)
                                     { return value % 4; });
  vector<int> flopSuitValues = Map(flop, [](int value)
                                   { return value % 4; });
  vector<int> flopCardValues = Map(flop, [](int value)
                                   { return (value - 1) / 4; });
  vector<int> communityCardValues = Map(communityCards, [](int value)
                                        { return (value - 1) / 4; });
  vector<int> dealerCardValues = Map(dealerCards, [](int value)
                                     { return (value - 1) / 4; });
  vector<int> sortedSuitValues;
  sortedSuitValues.insert(sortedSuitValues.end(), playerSuitValues.begin(), playerSuitValues.end());
  sortedSuitValues.insert(sortedSuitValues.end(), flopSuitValues.begin(), flopSuitValues.end());
  sort(sortedSuitValues.begin(), sortedSuitValues.end());
  // Basic Strategy
  if (knownDealerCards == 0 && knownFlopCards == 0 && knownTurnRiverCards == 0)
  {
    // Preflop
    if (
        // Ax
        playerCardValues[0] >= 12 || playerCardValues[1] >= 12 ||
        // K2s+, K5+
        (playerCardValues[0] >= 11 && (playerCardValues[1] >= 3 || (playerHand[0] - playerHand[1]) % 4 == 0)) ||
        (playerCardValues[1] >= 11 && (playerCardValues[0] >= 3 || (playerHand[1] - playerHand[0]) % 4 == 0)) ||
        // Q6s+, Q8+
        (playerCardValues[0] >= 10 && (playerCardValues[1] >= 6 || (playerCardValues[1] >= 4 && (playerHand[0] - playerHand[1]) % 4 == 0))) ||
        (playerCardValues[1] >= 10 && (playerCardValues[0] >= 6 || (playerCardValues[0] >= 4 && (playerHand[1] - playerHand[0]) % 4 == 0))) ||
        // J8s+, JT+
        (playerCardValues[0] >= 9 && (playerCardValues[1] >= 8 || (playerCardValues[1] >= 6 && (playerHand[0] - playerHand[1]) % 4 == 0))) ||
        (playerCardValues[1] >= 9 && (playerCardValues[0] >= 8 || (playerCardValues[0] >= 6 && (playerHand[1] - playerHand[0]) % 4 == 0))) ||
        // 33+
        (playerCardValues[0] == playerCardValues[1] && playerCardValues[0] >= 1))
    {
      playBet = 4;
    }
    // Postflop
    else if (
        // Two pair or better
        (FiveCardLookupFast(postFlopHand.data()) >> 12 >= 3 &&
         // Not 3 of a kind with all 3 same flop card
         !(FiveCardLookupFast(postFlopHand.data()) >> 12 == 4 && flopCardValues[0] == flopCardValues[1] && flopCardValues[0] == flopCardValues[2])) ||
        // Hidden pair except pocket deuces
        (FiveCardLookupFast(postFlopHand.data()) >> 12 == 2 && !(playerCardValues[0] == 0 && playerCardValues[1] == 0) && isUnique(flopCardValues)) ||
        // Four to a flush including a hidden 10 or better
        ((sortedSuitValues[1] == sortedSuitValues[4] || sortedSuitValues[0] == sortedSuitValues[3]) &&
         ((sortedSuitValues[2] == playerSuitValues[0] && playerCardValues[0] >= 8) || (sortedSuitValues[2] == playerSuitValues[1] && playerCardValues[1] >= 8))))
    {
      playBet = 2;
    }
    // Post-river
    else {
      // Early termination: check high-priority conditions first
      int postRiverRank = LookupHandFast(postRiverHand.data());
      int postRiverCategory = postRiverRank >> 12;
      int communityCategory = FiveCardLookupFast(communityCards.data()) >> 12;
      
      if (
          // Two pair or better
          (postRiverCategory >= 3 &&
           // Not two pair with two pair on the board
           !(postRiverCategory == 3 && communityCategory == 3) &&
           // Not three of a kind with three of a kind on the board
           !(postRiverCategory == 4 && communityCategory == 4)) ||
          // Hidden pair
          (postRiverCategory == 2 && isUnique(communityCardValues)) ||
          // Less than 21 dealer outs (most expensive check - do last)
          getBadOuts(playerHand, communityCards, 21) < 21)
      {
        playBet = 1;
      }
    }
  }
  // 1 known flop card and 1 known dealer card
  else if (knownDealerCards == 1 && knownFlopCards == 1 && knownTurnRiverCards == 0)
  {
    // Preflop
    bool allow4xBet = true;
    if (excludeFishyPlays) {
      if (playerCardValues[0] != playerCardValues[1]) {
        int maxCard = (playerCardValues[0] > playerCardValues[1]) ? playerCardValues[0] : playerCardValues[1];
        // Ten high or lower means max card is 8 or less (Ten=8 in internal representation, so values 0-8 are 2-through-Ten)
        if (maxCard <= 8) {
          allow4xBet = false; // Don't allow 4x bet for fishy play
        }
      }
      // If it's a pocket pair or higher than Ten high, allow 4x bet
    }
    
    if (allow4xBet && (
        // Flop card gives you three of a kind
        (playerCardValues[0] == playerCardValues[1] && playerCardValues[0] == flopCardValues[0]) ||
        // Pair of dealer cards or better
        (playerCardValues[0] == playerCardValues[1] && playerCardValues[0] >= dealerCardValues[0]) ||
        // Any pair with flop card, better than dealer card
        (playerCardValues[0] == flopCardValues[0] && playerCardValues[0] > dealerCardValues[0]) || (playerCardValues[1] == flopCardValues[0] && playerCardValues[1] > dealerCardValues[0]) ||
        // Any pair with flop card, same as dealer card, with T+ kicker
        (playerCardValues[0] == flopCardValues[0] && playerCardValues[0] == dealerCardValues[0] && playerCardValues[1] >= 8) ||
        (playerCardValues[1] == flopCardValues[0] && playerCardValues[1] == dealerCardValues[0] && playerCardValues[0] >= 8) ||
        // If dealer doesn't have a pair
        (dealerCardValues[0] != flopCardValues[0] &&
         // Dealer card or better and ten or better
         ((playerCardValues[0] >= dealerCardValues[0] && playerCardValues[1] >= 8) || (playerCardValues[1] >= dealerCardValues[0] && playerCardValues[0] >= 8) ||
          // Pair of 7s or better
          (playerCardValues[0] == playerCardValues[1] && playerCardValues[0] >= 5) ||
          (playerCardValues[0] == flopCardValues[0] && playerCardValues[0] >= 5) ||
          (playerCardValues[1] == flopCardValues[0] && playerCardValues[1]) ||
          // Q8s+ if dealer card worse than Q
          (playerCardValues[0] == 10 && dealerCardValues[0] < playerCardValues[0] && playerCardValues[1] >= 6 && (playerHand[0] - playerHand[1]) % 4 == 0) ||
          (playerCardValues[1] == 10 && dealerCardValues[0] < playerCardValues[1] && playerCardValues[0] >= 6 && (playerHand[0] - playerHand[1]) % 4 == 0) ||
          // K6s+ if dealer card worse than K
          (playerCardValues[0] == 11 && dealerCardValues[0] < playerCardValues[0] && playerCardValues[1] >= 4 && (playerHand[0] - playerHand[1]) % 4 == 0) ||
          (playerCardValues[1] == 11 && dealerCardValues[0] < playerCardValues[1] && playerCardValues[0] >= 4 && (playerHand[0] - playerHand[1]) % 4 == 0) ||
          // A2s+, A7o+ if dealer card worse than A
          (playerCardValues[0] == 12 && dealerCardValues[0] < playerCardValues[0] && (playerCardValues[1] >= 5 || (playerHand[0] - playerHand[1]) % 4 == 0)) ||
          (playerCardValues[1] == 12 && dealerCardValues[0] < playerCardValues[1] && (playerCardValues[0] >= 5 || (playerHand[0] - playerHand[1]) % 4 == 0)) ||
          // H9s+ if dealer card is H = A, K, Q
          (playerCardValues[0] >= 10 && dealerCardValues[0] == playerCardValues[0] && playerCardValues[1] >= 7 && (playerHand[0] - playerHand[1]) % 4 == 0) ||
          (playerCardValues[1] >= 10 && dealerCardValues[0] == playerCardValues[1] && playerCardValues[0] >= 7 && (playerHand[0] - playerHand[1]) % 4 == 0)))))
    {
      playBet = 4;
    }
    // Postflop
    else if (
        // Less than 12 bad outs and we are ahead
        getBadOutsFlop(playerHand, flop, {dealerCards.begin(), dealerCards.begin() + 1}, 12) < 12)
    {
      playBet = 2;
    }
    // Post-river
    else if (
        // At least 10 good outs
        getGoodOuts(playerHand, communityCards, dealerCards[0], 10) >= 10 ||
        // At least 15 good outs if best case is push
        getGoodOuts(playerHand, communityCards, dealerCards[0], 15, true) >= 15)
    {
      playBet = 1;
    }
  }
  else if (knownDealerCards == 2 && knownFlopCards == 1 && knownTurnRiverCards == 2)
  {
    // Preflop
    vector<int> knownPlayerHand;
    knownPlayerHand.insert(knownPlayerHand.end(), playerHand.begin(), playerHand.end());
    knownPlayerHand.push_back(flop[0]);
    knownPlayerHand.insert(knownPlayerHand.end(), communityCards.begin() + 3, communityCards.begin() + 5);
    vector<int> knownDealerHand;
    knownDealerHand.insert(knownDealerHand.end(), dealerCards.begin(), dealerCards.end());
    knownDealerHand.push_back(flop[0]);
    knownDealerHand.insert(knownDealerHand.end(), communityCards.begin() + 3, communityCards.begin() + 5);
    
    bool allow4xBet = true;
    if (excludeFishyPlays) {
      if (playerCardValues[0] != playerCardValues[1]) {
        int maxCard = (playerCardValues[0] > playerCardValues[1]) ? playerCardValues[0] : playerCardValues[1];
        // Ten high or lower means max card is 8 or less (Ten=8 in internal representation, so values 0-8 are 2-through-Ten)
        if (maxCard <= 8) {
          allow4xBet = false; // Don't allow 4x bet for fishy play
        }
      }
      // If it's a pocket pair or higher than Ten high, allow 4x bet
    }
    
    if (allow4xBet && FiveCardLookupFast(knownPlayerHand.data()) > FiveCardLookupFast(knownDealerHand.data()))
    {
      playBet = 4;
    }
    else {
      vector<int> dealerPostRiverHand;
      dealerPostRiverHand.insert(dealerPostRiverHand.end(), dealerCards.begin(), dealerCards.end());
      dealerPostRiverHand.insert(dealerPostRiverHand.end(), communityCards.begin(), communityCards.end());
      if (LookupHandFast(postRiverHand.data()) >= LookupHandFast(dealerPostRiverHand.data()))
      {
        playBet = 2;
      }
    }
  }
  return playBet;
}

double calculateProfitUTH(vector<int> deck, int knownDealerCards, int knownFlopCards, int knownTurnRiverCount = 0, bool excludeFishyPlays = false)
{
  // Optimized to reduce vector allocations by using manual array copying
  int communityCards[5];
  int playerCards[2];
  int dealerCards[2];
  int playerHand[7];
  int dealerHand[7];
  
  // Manual array copying for better performance
  for (int i = 0; i < 5; i++) communityCards[i] = deck[i];
  for (int i = 0; i < 2; i++) playerCards[i] = deck[5 + i];
  for (int i = 0; i < 2; i++) dealerCards[i] = deck[7 + i];
  
  // Construct hands directly
  for (int i = 0; i < 2; i++) playerHand[i] = playerCards[i];
  for (int i = 0; i < 5; i++) playerHand[2 + i] = communityCards[i];
  for (int i = 0; i < 2; i++) dealerHand[i] = dealerCards[i];
  for (int i = 0; i < 5; i++) dealerHand[2 + i] = communityCards[i];
  
  // Convert to vectors for getPlayBet compatibility
  vector<int> playerCardsVec(playerCards, playerCards + 2);
  vector<int> communityCardsVec(communityCards, communityCards + 5);
  vector<int> dealerCardsVec(dealerCards, dealerCards + 2);
  
  // Use standard strategy function
  int playBet = getPlayBet(playerCardsVec, communityCardsVec, dealerCardsVec, knownDealerCards, knownFlopCards, knownTurnRiverCount, excludeFishyPlays);
  double profit = 0;
  int playerHandRank = LookupHandFast(playerHand);
  int dealerHandRank = LookupHandFast(dealerHand);
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
    if (dealerHandRank >> 12 > 1 || playBet == 0)
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
struct result
{
  vector<int> playerCards;
  vector<int> communityCards;
  vector<int> dealerCards;
  double profit;
  double edge;
  double stDev;
  string error;
};
result runUthSimulations(vector<int> deck, int64_t sims, int handsPerSession, int knownDealerCards, int knownFlopCards, int knownTurnRiverCards, bool excludeFishyPlays)
{
  numberOfSimulations = sims;
  atomicCurrentSimulationNumber.store(0, std::memory_order_relaxed); // Reset progress counter
  
  // Load the HandRanks.DAT file once and cache it
  if (!loadHandRanks())
    return result{{}, {}, {}, 0, 0, 0, "HandRanks.dat not found"};
  
  // Incremental statistics calculation to handle large simulations without memory issues
  double totalProfit = 0.0;
  double totalProfitSquared = 0.0;
  int64_t simulationCount = 0;
  
  // For grouped statistics (limited to avoid memory issues)
  const int maxGroupedProfits = 1000000; // Limit to 1M groups to prevent memory issues
  vector<double> groupedProfits;
  groupedProfits.reserve(maxGroupedProfits);
  int currentGroupProfit = 0;
  int simulationsInCurrentGroup = 0;
  
  if (deck.size() > 0)
  {
    numberOfSimulations = 1;
    double handProfit = calculateProfitUTH(deck, knownDealerCards, knownFlopCards, knownTurnRiverCards, excludeFishyPlays);
    
    totalProfit = handProfit;
    totalProfitSquared = handProfit * handProfit;
    simulationCount = 1;
    groupedProfits.push_back(handProfit);
    
    // Update final progress
    atomicCurrentSimulationNumber.store(numberOfSimulations, std::memory_order_relaxed);
  }
  else
  {
#pragma omp parallel
    {
      // Thread-local variables for incremental statistics
      double localTotalProfit = 0.0;
      double localTotalProfitSquared = 0.0;
      int64_t localSimulationCount = 0;
      
      // Thread-local grouped profits (limited size)
      const int localMaxGroups = 10000; // Local limit per thread
      vector<double> localGroupedProfits;
      localGroupedProfits.reserve(localMaxGroups);
      int localCurrentGroupProfit = 0;
      int localSimulationsInCurrentGroup = 0;
      
      // Thread-local RNG to avoid contention
      std::random_device rd;
      std::mt19937 local_rng(rd());
      
      // Pre-allocate deck array outside loop
      vector<int> newDeck(52);
      
#pragma omp for schedule(dynamic) nowait
      for (int64_t i = 0; i < numberOfSimulations; i++)
      {
        // Only update progress periodically to reduce contention (less frequent for better performance)
        if (i % 2000 == 0) {
          atomicCurrentSimulationNumber.store(i + 1, std::memory_order_relaxed);
        }
        
        // Optimized deck copy and shuffle
        for (int j = 0; j < 52; j++) {
          newDeck[j] = baseDeck[j];
        }
        // Fisher-Yates shuffle for better performance
        for (int j = 51; j > 0; j--) {
          int k = local_rng() % (j + 1);
          std::swap(newDeck[j], newDeck[k]);
        }
        
        // Process simulation
        double handProfit = calculateProfitUTH(newDeck, knownDealerCards, knownFlopCards, knownTurnRiverCards, excludeFishyPlays);
        
        // Incremental statistics calculation
        localTotalProfit += handProfit;
        localTotalProfitSquared += handProfit * handProfit;
        localSimulationCount++;
        
        // Incremental grouped profits (limited to prevent memory issues)
        localCurrentGroupProfit += handProfit;
        localSimulationsInCurrentGroup++;
        
        if (localSimulationsInCurrentGroup >= handsPerSession) {
          if (localGroupedProfits.size() < localMaxGroups) {
            localGroupedProfits.push_back(localCurrentGroupProfit);
          }
          localCurrentGroupProfit = 0;
          localSimulationsInCurrentGroup = 0;
        }
      }
      
#pragma omp critical
      {
        totalProfit += localTotalProfit;
        totalProfitSquared += localTotalProfitSquared;
        simulationCount += localSimulationCount;
        
        // Merge grouped profits (limited to prevent memory overflow)
        for (double groupProfit : localGroupedProfits) {
          if (groupedProfits.size() < maxGroupedProfits) {
            groupedProfits.push_back(groupProfit);
          }
        }
      }
    }
    
    // Update final progress
    atomicCurrentSimulationNumber.store(numberOfSimulations, std::memory_order_relaxed);
  }
  
  // Calculate final statistics from incremental data
  double profit = totalProfit;
  double edge = simulationCount > 0 ? profit / simulationCount : 0.0;
  double stDev = 0.0;
  
  // Calculate standard deviation using online algorithm
  if (simulationCount > 0) {
    double mean = edge;
    double variance = (totalProfitSquared / simulationCount) - (mean * mean);
    stDev = sqrt(variance);
  }
  
  // Use grouped profits for more accurate stDev if available
  if (groupedProfits.size() > 0) {
    double groupedProfit = accumulate(groupedProfits.begin(), groupedProfits.end(), 0.0);
    double groupedEdge = groupedProfit / groupedProfits.size();

    vector<double> diff(groupedProfits.size());
    transform(groupedProfits.begin(), groupedProfits.end(), diff.begin(), [groupedEdge](double x)
              { return x - groupedEdge; });
    double variance = inner_product(diff.begin(), diff.end(), diff.begin(), 0.0);
    stDev = sqrt(variance / groupedProfits.size());
  }
  vector<int> communityCards;
  vector<int> playerCards;
  vector<int> dealerCards;
  vector<int> playerHand;
  vector<int> dealerHand;
  if (deck.size())
  {
    communityCards.insert(communityCards.end(), deck.begin(), deck.begin() + 5);
    playerCards.insert(playerCards.end(), deck.begin() + 5, deck.begin() + 7);
    dealerCards.insert(dealerCards.end(), deck.begin() + 7, deck.begin() + 9);
    playerHand.insert(playerHand.end(), playerCards.begin(), playerCards.end());
    playerHand.insert(playerHand.end(), communityCards.begin(), communityCards.end());
    dealerHand.insert(dealerHand.end(), dealerCards.begin(), dealerCards.end());
    dealerHand.insert(dealerHand.end(), communityCards.begin(), communityCards.end());
  }
  return result{
      playerCards,
      communityCards,
      dealerCards,
      profit,
      edge,
      stDev,
      ""};
}

Value GetSimulationStatus(const CallbackInfo &info)
{
  Env env = info.Env();
  // Pre-load handranks file to improve performance on first simulation
  loadHandRanks();
  Object obj = Object::New(env);
  // Use atomic counter for thread-safe access
  currentSimulationNumber = atomicCurrentSimulationNumber.load(std::memory_order_relaxed);
  Value currSimNum = Number::New(info.Env(), static_cast<double>(currentSimulationNumber));
  Value numOfSims = Number::New(info.Env(), static_cast<double>(numberOfSimulations));
  obj.Set("currentSimulationNumber", currSimNum);
  obj.Set("numberOfSimulations", numOfSims);
  return obj;
}

class SimulationWorker : public Napi::AsyncWorker
{
public:
  SimulationWorker(Napi::Function &callback, vector<int> deck, int64_t numberOfSimulations, int handsPerSession, int knownDealerCards, int knownFlopCards, int knownTurnRiverCards, bool excludeFishyPlays)
      : Napi::AsyncWorker(callback), deck(deck), numberOfSimulations(numberOfSimulations), handsPerSession(handsPerSession), knownDealerCards(knownDealerCards),
        knownFlopCards(knownFlopCards), knownTurnRiverCards(knownTurnRiverCards), excludeFishyPlays(excludeFishyPlays), profit(0), edge(0), stDev(0), error("") {}
  ~SimulationWorker() {}

  // Executed inside the worker-thread.
  // It is not safe to access JS engine data structure
  // here, so everything we need for input and output
  // should go on `this`.
  void Execute()
  {
    result simResults = runUthSimulations(deck, numberOfSimulations, handsPerSession, knownDealerCards, knownFlopCards, knownTurnRiverCards, excludeFishyPlays);
    profit = simResults.profit;
    edge = simResults.edge;
    playerCards = simResults.playerCards;
    communityCards = simResults.communityCards;
    dealerCards = simResults.dealerCards;
    error = simResults.error;
    stDev = simResults.stDev;
  }

  // Executed when the async work is complete
  // this function will be run inside the main event loop
  // so it is safe to use JS engine data again
  void OnOK()
  {
    Napi::HandleScope scope(Env());
    Napi::Array playerCardsArr = Napi::Array::New(Env(), playerCards.size());
    uint32_t j = 0;
    for (auto &&it : playerCards)
    {
      playerCardsArr[j++] = Number::New(Env(), it);
    }
    Napi::Array communityCardsArr = Napi::Array::New(Env(), communityCards.size());
    j = 0;
    for (auto &&it : communityCards)
    {
      communityCardsArr[j++] = Number::New(Env(), it);
    }
    Napi::Array dealerCardsArr = Napi::Array::New(Env(), dealerCards.size());
    j = 0;
    for (auto &&it : dealerCards)
    {
      dealerCardsArr[j++] = Number::New(Env(), it);
    }
    Object obj = Object::New(Env());
    obj.Set("playerCards", playerCardsArr);
    obj.Set("communityCards", communityCardsArr);
    obj.Set("dealerCards", dealerCardsArr);
    Callback().Call({Napi::Number::New(Env(), profit),
                     Napi::Number::New(Env(), edge),
                     Napi::Number::New(Env(), stDev),
                     obj,
                     Napi::String::New(Env(), error)});
  }

private:
  vector<int> deck;
  vector<int> playerCards;
  vector<int> dealerCards;
  vector<int> communityCards;
  int64_t numberOfSimulations;
  int handsPerSession;
  int knownDealerCards;
  int knownFlopCards;
  int knownTurnRiverCards;
  bool excludeFishyPlays;
  double profit;
  double edge;
  double stDev;
  string error;
};

// Asynchronous access to the `Estimate()` function
Napi::Value RunUthSimulations(const Napi::CallbackInfo &info)
{
  Array deckArray = info[0].As<Array>();
  numberOfSimulations = info[1].ToNumber().Int64Value();
  int handsPerSession = info[2].ToNumber();
  int knownDealerCards = info[3].ToNumber();
  int knownFlopCards = info[4].ToNumber();
  int knownTurnRiverCards = info[5].ToNumber();
  bool excludeFishyPlays = info[6].ToBoolean();
  vector<int> deck;
  Napi::Function callback = info[7].As<Napi::Function>();
  if (deckArray.Length() > 0)
  {
    for (size_t i = 0; i < deckArray.Length(); i++)
    {
      int value = (int)deckArray.Get(i).As<Number>();
      deck.push_back(value);
    }
  }
  SimulationWorker *piWorker = new SimulationWorker(callback, deck, numberOfSimulations, handsPerSession, knownDealerCards, knownFlopCards, knownTurnRiverCards, excludeFishyPlays);
  piWorker->Queue();
  return info.Env().Undefined();
}

Napi::Object Init(Napi::Env env, Napi::Object exports)
{
  exports.Set("getSimulationStatus", Function::New(env, GetSimulationStatus));
  exports.Set("runUthSimulations", Function::New(env, RunUthSimulations));
  return exports;
}

NODE_API_MODULE(addon, Init)
