#include <napi.h>
#include <iostream>
#include <cstring>
#include <iterator>
#include <numeric>

#define DWORD int32_t

using namespace Napi;
using namespace std;

const int WORST_HAND_4S_OR_BETTER = 8651;

// The handranks lookup table- loaded from HANDRANKS.DAT.
int HR[32487834];

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

vector<int> getHandRanks(vector<int> playerHand, vector<int> flop, vector<int> deadCards)
{
  vector<int> baseHand;
  baseHand.insert(baseHand.end(), playerHand.begin(), playerHand.end());
  baseHand.insert(baseHand.end(), flop.begin(), flop.end());

  vector<int> cardsInPlay = deadCards;
  cardsInPlay.insert(cardsInPlay.end(), playerHand.begin(), playerHand.end());
  cardsInPlay.insert(cardsInPlay.end(), flop.begin(), flop.end());

  vector<int> handRanks;
  vector<bool> v(52);
  fill(v.begin(), v.begin() + 7 - baseHand.size(), true);
  do
  {
    vector<int> hand = baseHand;
    for (int i = 0; i < 52; ++i)
    {
      if (v[i])
      {
        if (find(cardsInPlay.begin(), cardsInPlay.end(), i + 1) != cardsInPlay.end())
        {
          break;
        }
        hand.push_back(i + 1);
      }
    }
    if (hand.size() == 7)
    {
      int handScore = LookupHand(hand);
      handRanks.push_back(handScore);
    }
  } while (std::prev_permutation(v.begin(), v.end()));
  return handRanks;
}

float calculateEquity(vector<int> player1HandRanks, vector<int> player2HandRanks, bool beatTheDealerMode)
{
  int player1Wins = 0;
  for (int i = 0; i < player1HandRanks.size(); i++)
  {
    if (player1HandRanks[i] > player2HandRanks[i] && (!beatTheDealerMode || player2HandRanks[i] >= WORST_HAND_4S_OR_BETTER))
    {
      player1Wins += 2;
    }
    else if (player1HandRanks[i] == player2HandRanks[i] || (beatTheDealerMode && player2HandRanks[i] < WORST_HAND_4S_OR_BETTER))
    {
      player1Wins++;
    }
  }
  return (float)player1Wins / (float)(2 * player1HandRanks.size());
}

Value GetEquity(const CallbackInfo &info)
{
  Array player1HandArray = info[0].As<Array>();
  Array player2HandArray = info[1].As<Array>();
  Array flopArray = info[2].As<Array>();
  Boolean beatTheDealerMode = info[3].As<Boolean>();
  vector<int> player1Hand;
  vector<int> player2Hand;
  vector<int> flop;
  bool runAllHands = player2HandArray.Length() == 0;

  for (int i = 0; i < player1HandArray.Length(); i++)
  {
    int value = (int)player1HandArray.Get(i).As<Number>();
    player1Hand.push_back(value);
  }
  if (!runAllHands)
  {
    for (int i = 0; i < player2HandArray.Length(); i++)
    {
      int value = (int)player2HandArray.Get(i).As<Number>();
      player2Hand.push_back(value);
    }
  }
  for (int i = 0; i < flopArray.Length(); i++)
  {
    int value = (int)flopArray.Get(i).As<Number>();
    flop.push_back(value);
  }

  // Load the HandRanks.DAT file and map it into the HR array
  memset(HR, 0, sizeof(HR));
  FILE *fin = fopen("HandRanks.dat", "rb");
  if (!fin)
    return String::New(info.Env(), "fin");
  size_t bytesread = fread(HR, sizeof(HR), 1, fin); // get the HandRank Array
  fclose(fin);

  int handNo = 0;

  Value equity;
  if (runAllHands)
  {
    vector<float> equities;
    vector<int> cardsInPlay = player1Hand;
    cardsInPlay.insert(cardsInPlay.end(), flop.begin(), flop.end());
    vector<bool> v(52);
    fill(v.begin(), v.begin() + 2, true);
    do
    {
      vector<int> hand;
      for (int i = 0; i < 52; ++i)
      {
        if (v[i])
        {
          if (find(cardsInPlay.begin(), cardsInPlay.end(), i + 1) != cardsInPlay.end())
          {
            break;
          }
          hand.push_back(i + 1);
        }
      }
      if (hand.size() == 2)
      {
        vector<int> player1HandResults = getHandRanks(player1Hand, flop, hand);
        vector<int> player2HandResults = getHandRanks(hand, flop, player1Hand);
        equities.push_back(calculateEquity(player1HandResults, player2HandResults, beatTheDealerMode));
      }
      printf("\rHand %d of %d", ++handNo, (52 * 51) / 2);
      fflush(stdout);
    } while (std::prev_permutation(v.begin(), v.end()));
    equity = Number::New(info.Env(), accumulate(equities.begin(), equities.end(), 0.0) / equities.size());
  }
  else
  {
    vector<int> player1HandResults = getHandRanks(player1Hand, flop, player2Hand);
    vector<int> player2HandResults = getHandRanks(player2Hand, flop, player1Hand);
    equity = Number::New(info.Env(), calculateEquity(player1HandResults, player2HandResults, beatTheDealerMode));
  }
  return equity;
}

Napi::Object Init(Napi::Env env, Napi::Object exports)
{
  exports.Set("getEquity", Function::New(env, GetEquity));
  return exports;
}

NODE_API_MODULE(addon, Init)
