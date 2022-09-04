#include <napi.h>
#include <iostream>
#include <random>
#include <numeric>
#include "omp.h"

using namespace Napi;
using namespace std;

#define DWORD int32_t

const int ROYAL_FLUSH = 36874;

// The handranks lookup table- loaded from HANDRANKS.DAT.
int HR[32487834];

auto rng = std::default_random_engine{std::random_device{}()};
int currentSimulationNumber;
int numberOfSimulations;

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
      if (SixCardLookup(dealerHand) > LookupHand(currentHand))
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
      if ((dealerHand.size() == 5 && FiveCardLookup(dealerHand) > FiveCardLookup(currentHand)) ||
          (dealerHand.size() == 6 && SixCardLookup(dealerHand) > SixCardLookup(currentHand)))
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
      if (LookupHand(currentHand) > LookupHand(dealerHand))
      {
        goodOuts++;
      }
      else if (push && LookupHand(currentHand) == LookupHand(dealerHand))
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
        (FiveCardLookup(postFlopHand) >> 12 >= 3 &&
         // Not 3 of a kind with all 3 same flop card
         !(FiveCardLookup(postFlopHand) >> 12 == 4 && flopCardValues[0] == flopCardValues[1] && flopCardValues[0] == flopCardValues[2])) ||
        // Hidden pair except pocket deuces
        (FiveCardLookup(postFlopHand) >> 12 == 2 && !(playerCardValues[0] == 0 && playerCardValues[1] == 0) && isUnique(flopCardValues)) ||
        // Four to a flush including a hidden 10 or better
        ((sortedSuitValues[1] == sortedSuitValues[4] || sortedSuitValues[0] == sortedSuitValues[3]) &&
         ((sortedSuitValues[2] == playerSuitValues[0] && playerCardValues[0] >= 8) || (sortedSuitValues[2] == playerSuitValues[1] && playerCardValues[1] >= 8))))
    {
      playBet = 2;
    }
    // Post-river
    else if (
        // Two pair or better
        (LookupHand(postRiverHand) >> 12 >= 3 &&
         // Not two pair with two pair on the board
         !(LookupHand(postRiverHand) >> 12 == 3 && FiveCardLookup(communityCards) >> 12 == 3) &&
         // Not three of a kind with three of a kind on the board
         !(LookupHand(postRiverHand) >> 12 == 4 && FiveCardLookup(communityCards) >> 12 == 4)) ||
        // Hidden pair
        (LookupHand(postRiverHand) >> 12 == 2 && isUnique(communityCardValues)) ||
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
        // Dealer card or better and ten or better
        ((playerCardValues[0] >= dealerCardValues[0] && playerCardValues[1] >= 8) || (playerCardValues[1] >= dealerCardValues[0] && playerCardValues[0] >= 8)) ||
        // Pair of dealer cards or better
        (playerCardValues[0] == playerCardValues[1] && playerCardValues[0] == flopCardValues[0]) ||
        (playerCardValues[0] == playerCardValues[1] && playerCardValues[0] >= dealerCardValues[0]) ||
        // Pair of 7s or better
        (playerCardValues[0] == playerCardValues[1] && playerCardValues[0] >= 5 && !(dealerCardValues[0] == flopCardValues[0] && dealerCardValues[0] > playerCardValues[0])) ||
        (playerCardValues[0] == flopCardValues[0] && playerCardValues[0] >= 5) ||
        (playerCardValues[1] == flopCardValues[0] && playerCardValues[1] >= 5) ||
        // Any pair with flop card, better than dealer card
        (playerCardValues[0] == flopCardValues[0] && playerCardValues[0] > dealerCardValues[0]) || (playerCardValues[1] == flopCardValues[0] && playerCardValues[1] > dealerCardValues[0]) ||
        // Three to a flush including a hidden J or better
        (playerSuitValues[0] == playerSuitValues[1] && playerSuitValues[0] == flopSuitValues[0] && (playerCardValues[0] >= 9 || playerCardValues[1] >= 9)))
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
  string error;
};
result runUthSimulations(vector<int> deck, int sims, int knownDealerCards, int knownFlopCards, int knownTurnRiverCards)
{
  numberOfSimulations = sims;
  // Load the HandRanks.DAT file and map it into the HR array
  memset(HR, 0, sizeof(HR));
  FILE *fin = fopen("HandRanks.dat", "rb");
  if (!fin)
    return result{{}, {}, {}, 0, 0, "HandRanks.dat not found"};
  size_t bytesread = fread(HR, sizeof(HR), 1, fin); // get the HandRank Array
  std::fclose(fin);
  vector<double> profits;
  if (deck.size() > 0)
  {
    numberOfSimulations = 1;
    profits.push_back(calculateProfitUTH(deck, knownDealerCards, knownFlopCards, knownTurnRiverCards));
  }
  else
  {
#pragma omp parallel
    {
      std::vector<double> profits_private;
#pragma omp for schedule(dynamic) nowait
      for (int i = 0; i < numberOfSimulations; i++)
      {
        currentSimulationNumber = i + 1;
        vector<int> newDeck = {1, 2, 3, 4, 5, 6, 7, 8,
                               9, 10, 11, 12, 13, 14, 15,
                               16, 17, 18, 19, 20, 21, 22,
                               23, 24, 25, 26, 27, 28, 29,
                               30, 31, 32, 33, 34, 35, 36,
                               37, 38, 39, 40, 41, 42, 43,
                               44, 45, 46, 47, 48, 49, 50,
                               51, 52};
        std::shuffle(std::begin(newDeck), std::end(newDeck), rng);
        profits_private.push_back(calculateProfitUTH(newDeck, knownDealerCards, knownFlopCards, knownTurnRiverCards));
      }
#pragma omp critical
      profits.insert(profits.end(), profits_private.begin(), profits_private.end());
    }
  }
  double profit = accumulate(profits.begin(), profits.end(), 0.0);
  double edge = profit / profits.size();

  vector<double> diff(profits.size());
  transform(profits.begin(), profits.end(), diff.begin(), [edge](double x)
            { return x - edge; });
  double variance = inner_product(diff.begin(), diff.end(), diff.begin(), 0.0);
  double stdev = sqrt(variance / profits.size());
  cout << "Variance: " << variance << endl;
  cout << "Stdev: " << stdev;
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
      edge};
}

Value GetSimulationStatus(const CallbackInfo &info)
{
  Env env = info.Env();
  Object obj = Object::New(env);
  Value currSimNum = Number::New(info.Env(), currentSimulationNumber);
  Value numOfSims = Number::New(info.Env(), numberOfSimulations);
  obj.Set("currentSimulationNumber", currSimNum);
  obj.Set("numberOfSimulations", numOfSims);
  return obj;
}

class SimulationWorker : public Napi::AsyncWorker
{
public:
  SimulationWorker(Napi::Function &callback, vector<int> deck, int numberOfSimulations, int knownDealerCards, int knownFlopCards, int knownTurnRiverCards)
      : Napi::AsyncWorker(callback), deck(deck), numberOfSimulations(numberOfSimulations), knownDealerCards(knownDealerCards),
        knownFlopCards(knownFlopCards), knownTurnRiverCards(knownTurnRiverCards), profit(0), edge(0), error("") {}
  ~SimulationWorker() {}

  // Executed inside the worker-thread.
  // It is not safe to access JS engine data structure
  // here, so everything we need for input and output
  // should go on `this`.
  void Execute()
  {
    result simResults = runUthSimulations(deck, numberOfSimulations, knownDealerCards, knownFlopCards, knownTurnRiverCards);
    profit = simResults.profit;
    edge = simResults.edge;
    playerCards = simResults.playerCards;
    communityCards = simResults.communityCards;
    dealerCards = simResults.dealerCards;
    error = simResults.error;
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
                     obj,
                     Napi::String::New(Env(), error)});
  }

private:
  vector<int> deck;
  vector<int> playerCards;
  vector<int> dealerCards;
  vector<int> communityCards;
  int numberOfSimulations;
  int knownDealerCards;
  int knownFlopCards;
  int knownTurnRiverCards;
  double profit;
  double edge;
  string error;
};

// Asynchronous access to the `Estimate()` function
Napi::Value RunUthSimulations(const Napi::CallbackInfo &info)
{
  Array deckArray = info[0].As<Array>();
  numberOfSimulations = info[1].ToNumber();
  int knownDealerCards = info[2].ToNumber();
  int knownFlopCards = info[3].ToNumber();
  int knownTurnRiverCards = info[4].ToNumber();
  vector<int> deck;
  Napi::Function callback = info[5].As<Napi::Function>();
  if (deckArray.Length() > 0)
  {
    for (size_t i = 0; i < deckArray.Length(); i++)
    {
      int value = (int)deckArray.Get(i).As<Number>();
      deck.push_back(value);
    }
  }
  SimulationWorker *piWorker = new SimulationWorker(callback, deck, numberOfSimulations, knownDealerCards, knownFlopCards, knownTurnRiverCards);
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
