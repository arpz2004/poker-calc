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

void LookupSingleHands()
{
  printf("Looking up individual hands...\n\n");

  // Create a 7-card poker hand (each card gets a value between 1 and 52)
  // int cards[] = { 2, 6, 12, 14, 23, 26, 29 };
  vector<int> cards({2, 3, 4, 5, 6, 7, 8});
  int retVal = LookupHand(cards);
  printf("Category: %d\n", retVal >> 12);
  printf("Salt: %d\n", retVal & 0x00000FFF);
}

void EnumerateAll7CardHands()
{
  // Now let's enumerate every possible 7-card poker hand
  int u0, u1, u2, u3, u4, u5;
  int c0, c1, c2, c3, c4, c5, c6;
  int handTypeSum[10];                         // Frequency of hand category (flush, 2 pair, etc)
  int count = 0;                               // total number of hands enumerated
  memset(handTypeSum, 0, sizeof(handTypeSum)); // do init..

  // On your mark, get set, go...
  //DWORD dwTime = GetTickCount();

  for (c0 = 1; c0 < 47; c0++)
  {
    u0 = HR[53 + c0];
    for (c1 = c0 + 1; c1 < 48; c1++)
    {
      u1 = HR[u0 + c1];
      for (c2 = c1 + 1; c2 < 49; c2++)
      {
        u2 = HR[u1 + c2];
        for (c3 = c2 + 1; c3 < 50; c3++)
        {
          u3 = HR[u2 + c3];
          for (c4 = c3 + 1; c4 < 51; c4++)
          {
            u4 = HR[u3 + c4];
            for (c5 = c4 + 1; c5 < 52; c5++)
            {
              u5 = HR[u4 + c5];
              for (c6 = c5 + 1; c6 < 53; c6++)
              {

                handTypeSum[HR[u5 + c6] >> 12]++;

                // JMD: The above line of code is equivalent to:
                //int finalValue = HR[u5+c6];
                //int handCategory = finalValue >> 12;
                //handTypeSum[handCategory]++;

                count++;
              }
            }
          }
        }
      }
    }
  }

  //dwTime = GetTickCount() - dwTime;

  printf("BAD:              %d\n", handTypeSum[0]);
  printf("High Card:        %d\n", handTypeSum[1]);
  printf("One Pair:         %d\n", handTypeSum[2]);
  printf("Two Pair:         %d\n", handTypeSum[3]);
  printf("Trips:            %d\n", handTypeSum[4]);
  printf("Straight:         %d\n", handTypeSum[5]);
  printf("Flush:            %d\n", handTypeSum[6]);
  printf("Full House:       %d\n", handTypeSum[7]);
  printf("Quads:            %d\n", handTypeSum[8]);
  printf("Straight Flush:   %d\n", handTypeSum[9]);

  // Perform sanity checks.. make sure numbers are where they should be
  int testCount = 0;
  for (int index = 0; index < 10; index++)
    testCount += handTypeSum[index];
  if (testCount != count || count != 133784560 || handTypeSum[0] != 0)
  {
    printf("\nERROR!\nERROR!\nERROR!");
    return;
  }

  printf("\nEnumerated %d hands.\n", count);
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

String PokerEval(const CallbackInfo &info)
{

  // Load the HandRanks.DAT file and map it into the HR array
  memset(HR, 0, sizeof(HR));
  FILE *fin = fopen("HandRanks.dat", "rb");
  if (!fin)
    return String::New(info.Env(), "fin");
  size_t bytesread = fread(HR, sizeof(HR), 1, fin); // get the HandRank Array
  fclose(fin);

  // Enumerate all 133,784,560 possible 7-card poker hands...
  // EnumerateAll7CardHands();

  vector<int> player1Hand({39, 23});
  vector<int> player2Hand({46, 7});
  vector<int> flop({26, 33, 9});
  vector<int> cards({2, 3, 4, 5, 6, 26, 29});
  // int handRank = LookupHand(cards);
  // printf("Testing v2 %d", handRank);
  print(getHandRanks(player1Hand, flop, player2Hand));
  print(getHandRanks(player2Hand, flop, player1Hand));

  return String::New(info.Env(), "0");
}

Napi::Object Init(Napi::Env env, Napi::Object exports)
{
  exports.Set("pokerEval", Function::New(env, PokerEval));
  return exports;
}

NODE_API_MODULE(addon, Init)
