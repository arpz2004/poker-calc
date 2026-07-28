#include <napi.h>
#include <iostream>
#include <random>
#include <numeric>
#include <atomic>
#include "omp.h"

using namespace Napi;
using namespace std;

#define DWORD int32_t

const int ROYAL_FLUSH = 36874;

// The handranks lookup table- loaded from HANDRANKS.DAT.
int HR[32487834];
bool HR_loaded = false;

auto rng = std::default_random_engine{std::random_device{}()};
int currentSimulationNumber;
int numberOfSimulations;
std::atomic<int> atomicCurrentSimulationNumber{0}; // Thread-safe progress counter



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
      if (SixCardLookup(dealerHand) > LookupHandFast(currentHand.data()))
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
  vector<int> currentHand;
  currentHand.insert(currentHand.end(), hand.begin(), hand.end());
  currentHand.insert(currentHand.end(), flop.begin(), flop.end());
  int dealerOuts = 0;
  for (int i = 1; i <= 52; i++)
  {
    if (!(find(currentHand.begin(), currentHand.end(), i) != currentHand.end() || find(knownDealerCards.begin(), knownDealerCards.end(), i) != knownDealerCards.end()))
    {
      vector<int> dealerHand;
      dealerHand.insert(dealerHand.end(), flop.begin(), flop.end());
      dealerHand.insert(dealerHand.end(), knownDealerCards.begin(), knownDealerCards.end());
      dealerHand.insert(dealerHand.end(), i);
      if (dealerHand.size() == 6)
      {
        currentHand.insert(currentHand.end(), i);
      }
      if ((dealerHand.size() == 5 && FiveCardLookupFast(dealerHand.data()) > FiveCardLookupFast(currentHand.data())) ||
          (dealerHand.size() == 6 && SixCardLookup(dealerHand) > LookupHand(currentHand)))
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

int getGoodOuts(vector<int> hand, vector<int> communityCards, int knownDealerCard, int maxOuts, bool push = false)
{
  vector<int> currentHand;
  currentHand.insert(currentHand.end(), hand.begin(), hand.end());
  currentHand.insert(currentHand.end(), communityCards.begin(), communityCards.end());
  int goodOuts = 0;
  for (int i = 1; i <= 52; i++)
  {
    if (!(find(currentHand.begin(), currentHand.end(), i) != currentHand.end() || knownDealerCard == i))
    {
      vector<int> dealerHand;
      dealerHand.insert(dealerHand.end(), communityCards.begin(), communityCards.end());
      dealerHand.insert(dealerHand.end(), knownDealerCard);
      dealerHand.insert(dealerHand.end(), i);
      if (LookupHandFast(currentHand.data()) > LookupHandFast(dealerHand.data()))
      {
        goodOuts++;
      }
      else if (push && LookupHandFast(currentHand.data()) == LookupHandFast(dealerHand.data()))
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

int getPlayBet(vector<int> playerHand, vector<int> communityCards, vector<int> dealerCards, int knownDealerCards, int knownFlopCards, int knownTurnRiverCards)
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
    else if (
        // Two pair or better
        (LookupHandFast(postRiverHand.data()) >> 12 >= 3 &&
         // Not two pair with two pair on the board
         !(LookupHandFast(postRiverHand.data()) >> 12 == 3 && FiveCardLookupFast(communityCards.data()) >> 12 == 3) &&
         // Not three of a kind with three of a kind on the board
         !(LookupHandFast(postRiverHand.data()) >> 12 == 4 && FiveCardLookupFast(communityCards.data()) >> 12 == 4)) ||
        // Hidden pair
        (LookupHandFast(postRiverHand.data()) >> 12 == 2 && isUnique(communityCardValues)) ||
        // Less than 21 dealer outs
        getBadOuts(playerHand, communityCards, 21) < 21)
    {
      playBet = 1;
    }
  }
  // 1 known flop card and 1 known dealer card
  else if (knownDealerCards == 1 && knownFlopCards == 1 && knownTurnRiverCards == 0)
  {
    // Preflop
    if (
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
          (playerCardValues[1] >= 10 && dealerCardValues[0] == playerCardValues[1] && playerCardValues[0] >= 7 && (playerHand[0] - playerHand[1]) % 4 == 0))))
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
    vector<int> dealerPostRiverHand;
    dealerPostRiverHand.insert(dealerPostRiverHand.end(), dealerCards.begin(), dealerCards.end());
    dealerPostRiverHand.insert(dealerPostRiverHand.end(), communityCards.begin(), communityCards.end());
    if (FiveCardLookupFast(knownPlayerHand.data()) > FiveCardLookupFast(knownDealerHand.data()))
    {
      playBet = 4;
    }
    else if (LookupHandFast(postRiverHand.data()) >= LookupHandFast(dealerPostRiverHand.data()))
    {
      playBet = 2;
    }
  }
  return playBet;
}

double calculateProfitUTH(vector<int> deck, int knownDealerCards, int knownFlopCards, int knownTurnRiverCards)
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
  int playBet = getPlayBet(playerCards, communityCards, dealerCards, knownDealerCards, knownFlopCards, knownTurnRiverCards);
  double profit = 0;
  int playerHandRank = LookupHandFast(playerHand.data());
  int dealerHandRank = LookupHandFast(dealerHand.data());
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
result runUthSimulations(vector<int> deck, int sims, int handsPerSession, int knownDealerCards, int knownFlopCards, int knownTurnRiverCards)
{
  numberOfSimulations = sims;
  atomicCurrentSimulationNumber.store(0, std::memory_order_relaxed); // Reset progress counter
  
  // Load the HandRanks.DAT file once and cache it
  if (!loadHandRanks())
    return result{{}, {}, {}, 0, 0, 0, "HandRanks.dat not found"};
  
  vector<double> profits;
  vector<double> groupedProfits;
  if (deck.size() > 0)
  {
    numberOfSimulations = 1;
    profits.reserve(1);
    double handProfit = calculateProfitUTH(deck, knownDealerCards, knownFlopCards, knownTurnRiverCards);
    profits.push_back(handProfit);
  }
  else
  {
    profits.reserve(sims > 0 ? sims : 1); // Pre-allocate to avoid reallocations
#pragma omp parallel
    {
      std::vector<double> profits_private;
      int estimatedPerThread = (sims / omp_get_max_threads()) + 1;
      profits_private.reserve(estimatedPerThread > 0 ? estimatedPerThread : 1); // Pre-allocate per thread
      
      // Thread-local RNG to avoid contention
      std::random_device rd;
      std::mt19937 local_rng(rd());
      
      // Pre-allocate deck array outside loop
      vector<int> newDeck(52);
      
#pragma omp for schedule(dynamic) nowait
      for (int i = 0; i < numberOfSimulations; i++)
      {
        // Only update progress periodically to reduce contention
        if (i % 1000 == 0) {
          atomicCurrentSimulationNumber.store(i + 1, std::memory_order_relaxed);
        }
        
        // Optimized deck copy with loop unrolling
        for (int j = 0; j < 48; j += 4) {
          newDeck[j] = baseDeck[j];
          newDeck[j+1] = baseDeck[j+1];
          newDeck[j+2] = baseDeck[j+2];
          newDeck[j+3] = baseDeck[j+3];
        }
        newDeck[48] = baseDeck[48];
        newDeck[49] = baseDeck[49];
        newDeck[50] = baseDeck[50];
        newDeck[51] = baseDeck[51];
        
        std::shuffle(newDeck.begin(), newDeck.end(), local_rng);
        
        // Process simulation
        double handProfit = calculateProfitUTH(newDeck, knownDealerCards, knownFlopCards, knownTurnRiverCards);
        profits_private.push_back(handProfit);
      }
#pragma omp critical
      profits.insert(profits.end(), profits_private.begin(), profits_private.end());
    }
    
    // Update final progress
    atomicCurrentSimulationNumber.store(numberOfSimulations, std::memory_order_relaxed);
  }
  for (int i = 0; (i + 1) * handsPerSession <= profits.size(); i++)
  {
    double groupedProfit = accumulate(profits.begin() + i * handsPerSession, profits.begin() + (i + 1) * handsPerSession, 0.0);
    groupedProfits.push_back(groupedProfit);
  }
  double profit = accumulate(profits.begin(), profits.end(), 0.0);
  double edge = profit / profits.size();
  double stDev = 0.0;
  if (groupedProfits.size())
  {
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
      stDev};
}

Value GetSimulationStatus(const CallbackInfo &info)
{
  Env env = info.Env();
  // Pre-load handranks file to improve performance on first simulation
  loadHandRanks();
  Object obj = Object::New(env);
  // Use atomic counter for thread-safe access
  currentSimulationNumber = atomicCurrentSimulationNumber.load(std::memory_order_relaxed);
  Value currSimNum = Number::New(info.Env(), currentSimulationNumber);
  Value numOfSims = Number::New(info.Env(), numberOfSimulations);
  obj.Set("currentSimulationNumber", currSimNum);
  obj.Set("numberOfSimulations", numOfSims);
  return obj;
}

class SimulationWorker : public Napi::AsyncWorker
{
public:
  SimulationWorker(Napi::Function &callback, vector<int> deck, int numberOfSimulations, int handsPerSession, int knownDealerCards, int knownFlopCards, int knownTurnRiverCards)
      : Napi::AsyncWorker(callback), deck(deck), numberOfSimulations(numberOfSimulations), handsPerSession(handsPerSession), knownDealerCards(knownDealerCards),
        knownFlopCards(knownFlopCards), knownTurnRiverCards(knownTurnRiverCards), profit(0), edge(0), stDev(0), error("") {}
  ~SimulationWorker() {}

  // Executed inside the worker-thread.
  // It is not safe to access JS engine data structure
  // here, so everything we need for input and output
  // should go on `this`.
  void Execute()
  {
    result simResults = runUthSimulations(deck, numberOfSimulations, handsPerSession, knownDealerCards, knownFlopCards, knownTurnRiverCards);
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
  int numberOfSimulations;
  int handsPerSession;
  int knownDealerCards;
  int knownFlopCards;
  int knownTurnRiverCards;
  double profit;
  double edge;
  double stDev;
  string error;
};

// Asynchronous access to the `Estimate()` function
Napi::Value RunUthSimulations(const Napi::CallbackInfo &info)
{
  Array deckArray = info[0].As<Array>();
  numberOfSimulations = info[1].ToNumber();
  int handsPerSession = info[2].ToNumber();
  int knownDealerCards = info[3].ToNumber();
  int knownFlopCards = info[4].ToNumber();
  int knownTurnRiverCards = info[5].ToNumber();
  vector<int> deck;
  Napi::Function callback = info[6].As<Napi::Function>();
  if (deckArray.Length() > 0)
  {
    for (size_t i = 0; i < deckArray.Length(); i++)
    {
      int value = (int)deckArray.Get(i).As<Number>();
      deck.push_back(value);
    }
  }
  SimulationWorker *piWorker = new SimulationWorker(callback, deck, numberOfSimulations, handsPerSession, knownDealerCards, knownFlopCards, knownTurnRiverCards);
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
