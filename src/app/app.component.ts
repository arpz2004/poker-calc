import { Component, ElementRef, OnDestroy, OnInit, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { cardNotationToInt, cardSuits, cardValues } from './cardConversion';
import { getAllFlops } from './flops';
import { getAllHands } from './hands';
import { dealTexasHoldEm, handDisplay } from './utils';
import { PokerEvalService } from './pokerEval.service';

const WORST_HAND_4S_OR_BETTER = 2000131280;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'poker-calc';
  cardForm!: FormGroup;
  flop = '';
  executionTime = '';
  submitted = false;
  complete: Subject<void> = new Subject();
  beatTheDealerMode = false;
  quickMode = false;
  displayFlop = true;
  runAllHands = false;
  simulations: {
    player1Hand: string,
    player2Hand: string,
    equity: string
  }[] = [];
  handsAboveThirdEquity = '';
  averageEquityAboveThirdEquity = '';

  @ViewChildren('input') inputs!: QueryList<ElementRef<HTMLInputElement>>;
  @ViewChild('calculate') calculate!: ElementRef<HTMLElement>;

  constructor(private fb: FormBuilder, private pokerEvalService: PokerEvalService) { }

  ngOnInit(): void {
    const start = window.performance.now();
    this.pokerEvalService.getPokerEval().subscribe(resp => {
      const groupedHandEvals = resp.player1Results.map((score, i) => {
        return [
          {
            name: 'Player 1',
            hole: [] as number[],
            board: [] as number[],
            bestHand: +score,
          },
          {
            name: 'Player 2',
            hole: [] as number[],
            board: [] as number[],
            bestHand: +resp.player2Results[i]
          }
        ];
      });
      console.log('equity is: ', this.getEquityFromSimulations(groupedHandEvals));
      const end = window.performance.now();
      this.executionTime = (end - start).toFixed(0);
    });
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
      }),
      runAllFlops: [false],
      runAllHands: [false],
      beatTheDealer: [false],
      numberOfSimulations: [1000]
    });
    this.cardForm.get('runAllFlops')?.valueChanges.pipe(takeUntil(this.complete)).subscribe((value: boolean) => {
      this.displayFlop = !value;
    });
    this.cardForm.get('runAllHands')?.valueChanges.pipe(takeUntil(this.complete)).subscribe((value: boolean) => {
      this.runAllHands = value;
    });
    this.cardForm.get('beatTheDealer')?.valueChanges.pipe(takeUntil(this.complete)).subscribe((value: boolean) => {
      this.beatTheDealerMode = value;
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
      if (!Object.keys(cardValues).includes(cardValue)) {
        cardValue = '';
      }
      if (!Object.keys(cardSuits).includes(suit)) {
        suit = '';
      }
      newValue = cardValue + suit;
      control.setValue(newValue, { emitEvent: false });
      control.updateValueAndValidity({ emitEvent: false });
      if (this.quickMode && newValue) {
        this.focusNext();
      }
    });
    return control;
  }


  calculateEquity(): void {
    this.submitted = true;
    const start = window.performance.now();
    const length = this.cardForm.get('numberOfSimulations')?.value || 0;
    const player1HandString = [
      this.cardForm.get('player1')?.get('card1')?.value,
      this.cardForm.get('player1')?.get('card2')?.value
    ].filter(x => x);
    const player1Hand = player1HandString.map(card => cardNotationToInt(card));
    const player2HandString = [
      this.cardForm.get('player2')?.get('card1')?.value,
      this.cardForm.get('player2')?.get('card2')?.value
    ].filter(x => x);
    const player2Hand = player2HandString.map(card => cardNotationToInt(card));
    const board = [
      this.cardForm.get('flop')?.get('card1')?.value,
      this.cardForm.get('flop')?.get('card2')?.value,
      this.cardForm.get('flop')?.get('card3')?.value
    ].filter(x => x).map(card => cardNotationToInt(card));
    this.flop = handDisplay(board);
    let flops = [];
    const simulations: {
      player1Hand: string,
      player2Hand: string,
      equity: string
    }[] = [];
    if (this.cardForm.get('runAllHands')?.value) {
      getAllHands().forEach((handString, handIndex) => {
        const handResults: ReturnType<typeof dealTexasHoldEm>[] = [];
        console.log(`Hand ${handIndex + 1} of 1326`);
        const hand = handString.map(card => cardNotationToInt(card));
        flops = this.cardForm.get('runAllFlops')?.value ? getAllFlops(handString.concat(player2HandString)) : [board];
        flops.forEach(flop => {
          Array.from({ length }).forEach((n, i) => {
            handResults.push(dealTexasHoldEm(2, !i, { 0: hand, 1: player2Hand }, flop));
          });
        });
        simulations.push({
          player1Hand: handDisplay(hand),
          player2Hand: handDisplay(player2Hand),
          equity: this.getEquityFromSimulations(handResults)
        });
      });
    } else {
      const handResults: ReturnType<typeof dealTexasHoldEm>[] = [];
      flops = this.cardForm.get('runAllFlops')?.value ? getAllFlops(player1HandString.concat(player2HandString)) : [board];
      flops.forEach((flop, flopIndex) => {
        console.log(`Flop ${flopIndex + 1} of ${flops.length}`);
        Array.from({ length }).forEach((n, i) => {
          handResults.push(dealTexasHoldEm(2, !i, { 0: player1Hand, 1: player2Hand }, flop));
        });
      });
      simulations.push({
        player1Hand: handDisplay(player1Hand),
        player2Hand: handDisplay(player2Hand),
        equity: this.getEquityFromSimulations(handResults)
      });
    }

    const equityThreshold = 33.33;
    const handsAboveEquityThreshold: (typeof simulations) = [];
    const handsBelowEquityThreshold: (typeof simulations) = [];
    simulations.forEach(sim => {
      if (+sim.equity > equityThreshold) {
        handsAboveEquityThreshold.push(sim);
      } else {
        handsBelowEquityThreshold.push(sim);
      }
    });
    this.handsAboveThirdEquity = (100 * handsAboveEquityThreshold.length / simulations.length).toFixed(2);

    this.averageEquityAboveThirdEquity = (handsAboveEquityThreshold.reduce((acc, sim) => acc + +sim.equity, 0)
      / handsAboveEquityThreshold.length).toFixed(2);

    this.simulations = simulations;
    console.log({
      equityThreshold,
      handsAboveEquityThreshold,
      handsBelowEquityThreshold,
      handsAboveThirdEquity: this.handsAboveThirdEquity,
      averageEquityAboveThirdEquity: this.averageEquityAboveThirdEquity,
      simulations
    });
    const end = window.performance.now();
    this.executionTime = (end - start).toFixed(0);
  }

  getEquityFromSimulations(results: ReturnType<typeof dealTexasHoldEm>[]): string {
    const player1WinTimes = results.reduce((acc, val) => {
      const player1 = val.find(result => result.name === 'Player 1');
      const player2 = val.find(result => result.name === 'Player 2');
      const player1RankValue = player1?.bestHand as number;
      const player2RankValue = player2?.bestHand as number;
      let player1Wins;
      let tie;
      player1Wins = player1RankValue > player2RankValue;
      tie = player1RankValue === player2RankValue;
      if (tie) {
        console.log('tie values are: ', player1RankValue, player2RankValue);
      }
      if (this.beatTheDealerMode) {
        player1Wins = player1Wins && player2RankValue >= WORST_HAND_4S_OR_BETTER;
        tie = tie || player2RankValue < WORST_HAND_4S_OR_BETTER;
      }
      return acc + (player1Wins ? 1 : tie ? 0.5 : 0);
    }, 0);
    console.log('@@@@', player1WinTimes, results.length);
    return (player1WinTimes * 100 / results.length).toFixed(2);
  }

  focusNext(): void {
    const inputArray = this.inputs.toArray();
    const currentFocusIndex = inputArray.findIndex(input => {
      return input.nativeElement === document.activeElement;
    }
    );
    if (currentFocusIndex !== -1 && currentFocusIndex < inputArray.length - 1) {
      inputArray[currentFocusIndex + 1].nativeElement.select();
    } else {
      this.calculate.nativeElement.click();
    }
  }

  ngOnDestroy(): void {
    this.complete.next();
    this.complete.complete();
  }
}
