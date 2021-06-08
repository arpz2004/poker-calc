import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { dealTexasHoldEm, handDisplay } from './utils';

const values = {
  2: 0,
  3: 1,
  4: 2,
  5: 3,
  6: 4,
  7: 5,
  8: 6,
  9: 7,
  T: 8,
  J: 9,
  Q: 10,
  K: 11,
  A: 12
};
const suits = { c: 0, d: 1, h: 2, s: 3 };

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'poker-calc';
  cardForm!: FormGroup;
  equity = '';
  player1Hand = '';
  player2Hand = '';
  flop = '';
  executionTime = '';
  submitted = false;
  complete: Subject<void> = new Subject();

  constructor(private fb: FormBuilder) { }

  ngOnInit(): void {
    this.cardForm = this.fb.group({
      player1: this.fb.group({
        card1: this.createCardControl(),
        card2: this.createCardControl()
      }), player2: this.fb.group({
        card1: this.createCardControl(),
        card2: this.createCardControl()
      }),
      flop: this.fb.group({
        card1: this.createCardControl(),
        card2: this.createCardControl(),
        card3: this.createCardControl()
      })
    });
  }

  createCardControl(): FormControl {
    const control = this.fb.control(null);
    control.valueChanges.pipe(takeUntil(this.complete)).subscribe((value: string) => {
      let newValue = value;
      if (value.length > 2) {
        newValue = value.slice(0, 2);
      }
      let cardValue = newValue.charAt(0).toUpperCase();
      let suit = newValue.charAt(1).toLowerCase();
      if (!Object.keys(values).includes(cardValue)) {
        cardValue = '';
      }
      if (!Object.keys(suits).includes(suit)) {
        suit = '';
      }
      control.setValue(cardValue + suit, { emitEvent: false });
      control.updateValueAndValidity({ emitEvent: false });
    });
    return control;
  }

  cardNotationToInt(notation: string): number {
    let cardValue = 0;

    if (notation.length === 2) {
      cardValue = values[notation[0] as keyof typeof values] + 13 * suits[notation[1] as keyof typeof suits];
    } else if (notation.length === 1) {
      cardValue = values[notation[0] as keyof typeof values];
    }
    return cardValue;
  }


  calculateEquity(): void {
    this.submitted = true;
    const start = window.performance.now();
    const length = 10000;
    const results: ReturnType<typeof dealTexasHoldEm>[] = [];
    const player1Hand = [
      this.cardForm.get('player1')?.get('card1')?.value,
      this.cardForm.get('player1')?.get('card2')?.value
    ].filter(x => x).map(card => this.cardNotationToInt(card));
    const player2Hand = [
      this.cardForm.get('player2')?.get('card1')?.value,
      this.cardForm.get('player2')?.get('card2')?.value
    ].filter(x => x).map(card => this.cardNotationToInt(card));
    const board = [
      this.cardForm.get('flop')?.get('card1')?.value,
      this.cardForm.get('flop')?.get('card2')?.value,
      this.cardForm.get('flop')?.get('card3')?.value
    ].filter(x => x).map(card => this.cardNotationToInt(card));
    this.player1Hand = handDisplay(player1Hand);
    this.player2Hand = handDisplay(player2Hand);
    this.flop = handDisplay(board);
    Array.from({ length }).forEach(() => {
      results.push(dealTexasHoldEm(2, { 0: player1Hand, 1: player2Hand }, board));
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
    this.equity = (player1WinTimes / length * 100).toFixed(2);

    const end = window.performance.now();
    this.executionTime = (end - start).toFixed(0);
  }

  ngOnDestroy(): void {
    this.complete.next();
    this.complete.complete();
  }
}
