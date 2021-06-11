#include <napi.h>
#include <iostream>
#include <cstring>
#include <iterator>

#define DWORD int32_t

using namespace Napi;
using namespace std;

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
  vector<int> handRanks;
  for (int i = 1; i < 53; i++)
  {
    if (
        find(playerHand.begin(), playerHand.end(), i) != playerHand.end() ||
        find(flop.begin(), flop.end(), i) != flop.end() ||
        find(deadCards.begin(), deadCards.end(), i) != deadCards.end())
    {
      continue;
    }
    for (int j = i + 1; j < 53; j++)
    {
      if (
          find(playerHand.begin(), playerHand.end(), j) != playerHand.end() ||
          find(flop.begin(), flop.end(), j) != flop.end() ||
          find(deadCards.begin(), deadCards.end(), j) != deadCards.end())
      {
        continue;
      }
      vector<int> hand = baseHand;
      hand.insert(hand.end(), {i, j});
      int handScore = LookupHand(hand);
      handRanks.push_back(handScore);
    }
  }
  return handRanks;
}

Value PokerEval(const CallbackInfo &info)
{

  ArrayBuffer buf = info[0].As<ArrayBuffer>();
  const int32_t *array = reinterpret_cast<int32_t *>(buf.Data());
  vector<int> player1Hand;
  player1Hand.push_back(array[0]);
  player1Hand.push_back(array[1]);
  vector<int> player2Hand;
  player2Hand.push_back(array[2]);
  player2Hand.push_back(array[3]);
  vector<int> flop;
  flop.push_back(array[4]);
  flop.push_back(array[5]);
  flop.push_back(array[6]);

  // Load the HandRanks.DAT file and map it into the HR array
  memset(HR, 0, sizeof(HR));
  FILE *fin = fopen("HandRanks.dat", "rb");
  if (!fin)
    return String::New(info.Env(), "fin");
  size_t bytesread = fread(HR, sizeof(HR), 1, fin); // get the HandRank Array
  fclose(fin);

  vector<int> player1HandResults = getHandRanks(player1Hand, flop, player2Hand);
  vector<int> player2HandResults = getHandRanks(player2Hand, flop, player1Hand);

  Napi::Array p1Results = Napi::Array::New(info.Env(), player1HandResults.size());
  Napi::Array p2Results = Napi::Array::New(info.Env(), player2HandResults.size());

  uint32_t i = 0;
  for (auto &&it : player1HandResults)
  {
    p1Results[i++] = Number::New(info.Env(), it);
  }

  i = 0;
  for (auto &&it : player2HandResults)
  {
    p2Results[i++] = Number::New(info.Env(), it);
  }

  Env env = info.Env();
  Object obj = Object::New(env);
  obj.Set("player1Results", p1Results);
  obj.Set("player2Results", p2Results);

  return obj;
}

Napi::Object Init(Napi::Env env, Napi::Object exports)
{
  exports.Set("pokerEval", Function::New(env, PokerEval));
  return exports;
}

NODE_API_MODULE(addon, Init)
