#include <napi.h>
#include <iostream>
#include <cstring>
#include <iterator>
#include <numeric>

#define DWORD int32_t

using namespace Napi;
using namespace std;

const int WORST_HAND_4S_OR_BETTER = 8651;
const int ROYAL_FLUSH = 36874;

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

float getBeatTheDealerMultiplier(int handRank)
{
  float multiplier = 1;
  int handType = handRank >> 12;
  switch (handType)
  {
  case 6:
    multiplier = 7.0f / 6.0f;
    break;
  case 7:
    multiplier = 1.5f;
    break;
  case 8:
    multiplier = 25.0f / 6.0f;
    break;
  case 9:
    if (handRank == ROYAL_FLUSH)
    {
      multiplier = 205.0f / 6.0f;
    }
    else
    {
      multiplier = 55.0f / 6.0f;
    }
    break;
  }
  return multiplier;
}

float calculateEquityBeatTheDealer(vector<int> player1HandRanks, vector<int> player2HandRanks)
{
  float player1Wins = 0;
  for (int i = 0; i < player1HandRanks.size(); i++)
  {
    if (player1HandRanks[i] > player2HandRanks[i] && player2HandRanks[i] >= WORST_HAND_4S_OR_BETTER)
    {
      player1Wins += getBeatTheDealerMultiplier(player1HandRanks[i]);
    }
    else if (player1HandRanks[i] == player2HandRanks[i] || player2HandRanks[i] < WORST_HAND_4S_OR_BETTER)
    {
      player1Wins += 0.5f;
    }
  }
  return (float)player1Wins / (float)(player1HandRanks.size());
}

float calculateEquity(vector<int> player1HandRanks, vector<int> player2HandRanks)
{
  int player1Wins = 0;
  for (int i = 0; i < player1HandRanks.size(); i++)
  {
    if (player1HandRanks[i] > player2HandRanks[i])
    {
      player1Wins += 2;
    }
    else if (player1HandRanks[i] == player2HandRanks[i])
    {
      player1Wins++;
    }
  }
  return (float)player1Wins / (float)(2 * player1HandRanks.size());
}

Value GetEquitiesWhenCalling(const CallbackInfo &info)
{
  Array player1HandArray = info[0].As<Array>();
  vector<int> player1Hand;
  for (size_t i = 0; i < player1HandArray.Length(); i++)
  {
    int value = (int)player1HandArray.Get(i).As<Number>();
    player1Hand.push_back(value);
  }

  // Load the HandRanks.DAT file and map it into the HR array
  memset(HR, 0, sizeof(HR));
  FILE *fin = fopen("HandRanks.dat", "rb");
  if (!fin)
    return String::New(info.Env(), "fin");
  size_t bytesread = fread(HR, sizeof(HR), 1, fin); // get the HandRank Array
  fclose(fin);

  int flopNo = 0;

  vector<int> player2Hand;
  vector<float> equities;
  vector<float> equitiesWhenCalling;
  vector<bool> v(52);
  fill(v.begin(), v.begin() + 3, true);
  do
  {
    vector<int> flop;
    for (int i = 0; i < 52; ++i)
    {
      if (v[i])
      {
        if (find(player1Hand.begin(), player1Hand.end(), i + 1) != player1Hand.end())
        {
          break;
        }
        flop.push_back(i + 1);
      }
    }
    if (flop.size() == 3)
    {
      vector<int> player1HandResults = getHandRanks(player1Hand, flop, player2Hand);
      vector<int> player2HandResults = getHandRanks(player2Hand, flop, player1Hand);
      float equity = calculateEquityBeatTheDealer(player1HandResults, player2HandResults);
      // Calculate based on multiplier from hand
      float equityThreshold = 0.33333333f;
      if (equity > equityThreshold)
      {
        equitiesWhenCalling.push_back(equity);
      }
      equities.push_back(equity);
    }
    printf("\rFlop %d of %d", ++flopNo, 22100);
    fflush(stdout);
  } while (std::prev_permutation(v.begin(), v.end()));

  Napi::Array equitiesWhenCallingArr = Napi::Array::New(info.Env(), equitiesWhenCalling.size());
  uint32_t i = 0;
  for (auto &&it : equitiesWhenCalling)
  {
    equitiesWhenCallingArr[i++] = Number::New(info.Env(), it);
  }

  Env env = info.Env();
  Object obj = Object::New(env);
  obj.Set("equitiesWhenCalling", equitiesWhenCallingArr);
  obj.Set("totalEquities", equities.size());
  return obj;
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

  for (size_t i = 0; i < player1HandArray.Length(); i++)
  {
    int value = (int)player1HandArray.Get(i).As<Number>();
    player1Hand.push_back(value);
  }
  if (!runAllHands)
  {
    for (size_t i = 0; i < player2HandArray.Length(); i++)
    {
      int value = (int)player2HandArray.Get(i).As<Number>();
      player2Hand.push_back(value);
    }
  }
  for (size_t i = 0; i < flopArray.Length(); i++)
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
        equities.push_back(beatTheDealerMode ? calculateEquityBeatTheDealer(player1HandResults, player2HandResults) : calculateEquity(player1HandResults, player2HandResults));
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
    equity = Number::New(info.Env(), beatTheDealerMode ? calculateEquityBeatTheDealer(player1HandResults, player2HandResults) : calculateEquity(player1HandResults, player2HandResults));
  }
  return equity;
}

Napi::Object Init(Napi::Env env, Napi::Object exports)
{
  exports.Set("getEquity", Function::New(env, GetEquity));
  exports.Set("getEquitiesWhenCalling", Function::New(env, GetEquitiesWhenCalling));
  return exports;
}

NODE_API_MODULE(addon, Init)
