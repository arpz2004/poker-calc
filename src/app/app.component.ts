import { Component, OnInit } from '@angular/core';
import {
  dealTexasHoldEm, handDisplay
  // buildDeckPerformance,
  // handDisplayPerformance,
  // rankHandPerformance,
  // compareHandsPerformance,
  // dealCardsPerformance,
  // findBestHandTexasHoldemPerformance,
  // dealRoundPerformance,
  // dealTexasHoldemPerformance
} from './utils';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'poker-calc';

  ngOnInit(): void {
    const start = window.performance.now();
    const length = 10000;
    const results: ReturnType<typeof dealTexasHoldEm>[] = [];
    const player1Hand = [23, 43];
    const player2Hand = [45, 24];
    const board = [8, 9, 47];
    Array.from({ length }).forEach(() => {
      results.push(dealTexasHoldEm(2, { 0: player1Hand, 1: player2Hand }));
    });
    const player1WinTimes = results.reduce((acc, val) => {
      const player1 = val.find(result => result.name === 'Player 1');
      const player2 = val.find(result => result.name === 'Player 2');
      const player1RankValue = player1?.bestHand as number;
      const player2RankValue = player2?.bestHand as number;
      const player1Wins = player1RankValue > player2RankValue;
      const tie = player1RankValue === player2RankValue;
      return acc + (player1Wins ? 1 : tie ? 0.5 : 0);
    }, 0);
    console.log(`Player 1 Hand: ${handDisplay(player1Hand)}     Player 2 Hand: ${handDisplay(player2Hand)}`);
    console.log(`Board: ${handDisplay(board)}`);
    console.log(`Player 1 wins ${(player1WinTimes / length * 100).toFixed(2)}% of the time`);

    const end = window.performance.now();
    console.log(`Execution time: ${end - start} ms`);
    // console.log({
    //   buildDeckPerformance,
    //   handDisplayPerformance,
    //   rankHandPerformance,
    //   compareHandsPerformance,
    //   dealCardsPerformance,
    //   findBestHandTexasHoldemPerformance,
    //   dealRoundPerformance,
    //   dealTexasHoldemPerformance,
    //   total: buildDeckPerformance + handDisplayPerformance + rankHandPerformance +
    //     compareHandsPerformance + dealCardsPerformance + findBestHandTexasHoldemPerformance
    //     + dealRoundPerformance + dealTexasHoldemPerformance
    // });
  }
}
