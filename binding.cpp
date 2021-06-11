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

Value PokerEval(const CallbackInfo &info)
{
  Array array = info[0].As<Array>();
  vector<int> player1Hand;
  vector<int> player2Hand;
  vector<int> flop;
  for (int i = 0; i < array.Length(); i++)
  {
    int value = (int)array.Get(i).As<Number>();
    if (i < 2 && array.Length() >= 2)
    {
      player1Hand.push_back(value);
    }
    else if (i < 4 && array.Length() >= 4)
    {
      player2Hand.push_back(value);
    }
    else if (i < 7 && array.Length() == 7)
    {
      flop.push_back(value);
    }
  }

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
