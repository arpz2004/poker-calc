import { Component } from '@angular/core';
import { PokerEvalService } from './services/pokerEval.service';
import { handDisplay } from './utils/displayHand';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'poker-calc';
  submitted = false;
  loading = false;
  simulation?: {
    playerCards: number[],
    communityCards: number[],
    dealerCards: number[],
    equity: number
  };

  constructor(private pokerEvalService: PokerEvalService) { }

  runUthSimulation(): void {
    this.submitted = true;
    this.loading = true;
    this.pokerEvalService.runUthSimulations().subscribe((val) => {
      this.simulation = val;
      this.loading = false;
    }, () => {
      this.submitted = false;
      this.loading = false;
    });
  }

  displayHand(hand: number[]) {
    return handDisplay(hand);
  }
}
