import { Component, ElementRef, OnDestroy, OnInit, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { PokerEvalService } from './services/pokerEval.service';
import { cardNotationToInt, cardSuits, cardValues } from './utils/cardConversion';
import { handDisplay } from './utils/displayHand';

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
  loading = false;
  complete: Subject<void> = new Subject();
  beatTheDealerMode = false;
  quickMode = false;
  displayFlop = true;
  runAllHands = false;
  simulation?: {
    player1Hand: string,
    player2Hand: string,
    equity: number
  };
  flopsAboveThirdEquity = -1;
  averageEquityAboveThirdEquity = -1;
  totalEquities = -1;

  @ViewChildren('input') inputs!: QueryList<ElementRef<HTMLInputElement>>;
  @ViewChild('calculate') calculate!: ElementRef<HTMLElement>;

  constructor(private fb: FormBuilder, private pokerEvalService: PokerEvalService) { }

  ngOnInit(): void {
    this.cardForm = this.fb.group({
      player1: this.fb.group({
        card1: this.createCardControl('Jh'),
        card2: this.createCardControl('7h')
      }), player2: this.fb.group({
        card1: this.createCardControl('Kd'),
        card2: this.createCardControl('3h')
      }),
      flop: this.fb.group({
        card1: this.createCardControl('8d'),
        card2: this.createCardControl('Tc'),
        card3: this.createCardControl('4c')
      }),
      runAllFlops: [false],
      runAllHands: [false],
      beatTheDealer: [false]
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

  createCardControl(tmpVal: string): FormControl {
    const control = this.fb.control(tmpVal);
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

  calculateEquityOrEquitiesWhenCalling(): void {
    this.submitted = true;
    this.loading = true;
    this.flopsAboveThirdEquity = -1;
    this.averageEquityAboveThirdEquity = -1;
    if (this.runAllHands && this.beatTheDealerMode && this.cardForm.get('runAllFlops')?.value) {
      this.calculateEquitiesWhenCalling();
    } else {
      this.calculateEquity();
    }
  }

  calculateEquitiesWhenCalling(): void {
    const player1Hand: number[] = [
      this.cardForm.get('player1')?.get('card1')?.value,
      this.cardForm.get('player1')?.get('card2')?.value
    ].filter(x => x).map(card => cardNotationToInt(card));
    const start = window.performance.now();
    this.pokerEvalService.getEquitiesWhenCalling(player1Hand).subscribe(equities => {
      const equitiesWhenCalling = equities.equitiesWhenCalling;
      this.totalEquities = equities.totalEquities;
      this.flopsAboveThirdEquity = equitiesWhenCalling.length;
      this.averageEquityAboveThirdEquity = equitiesWhenCalling.reduce((a, b) => a + b) / this.flopsAboveThirdEquity;
      const end = window.performance.now();
      this.executionTime = (end - start).toFixed(0);
      console.log(equitiesWhenCalling, ' Average: ', this.averageEquityAboveThirdEquity, ' Length: ', this.flopsAboveThirdEquity, ' Total Equities: ', this.totalEquities);
      this.loading = false;
    });
  }


  calculateEquity(): void {
    const player1HandString: string[] = [
      this.cardForm.get('player1')?.get('card1')?.value,
      this.cardForm.get('player1')?.get('card2')?.value
    ].filter(x => x);
    const player1Hand = player1HandString.map(card => cardNotationToInt(card));
    const player2HandString: string[] = [
      this.cardForm.get('player2')?.get('card1')?.value,
      this.cardForm.get('player2')?.get('card2')?.value
    ].filter(x => x);
    const player2Hand = this.cardForm.get('runAllHands')?.value ? [] : player2HandString.map(card => cardNotationToInt(card));
    const board = this.cardForm.get('runAllFlops')?.value ? [] : [
      this.cardForm.get('flop')?.get('card1')?.value,
      this.cardForm.get('flop')?.get('card2')?.value,
      this.cardForm.get('flop')?.get('card3')?.value
    ].filter(x => x).map(card => cardNotationToInt(card));
    this.flop = handDisplay(board);
    const start = window.performance.now();
    this.pokerEvalService.getEquity(player1Hand, player2Hand, board, this.beatTheDealerMode).subscribe(equity => {
      this.simulation = {
        player1Hand: handDisplay(player1Hand),
        player2Hand: handDisplay(player2Hand),
        equity
      };
      const end = window.performance.now();
      this.executionTime = (end - start).toFixed(0);
      this.loading = false;
    });
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
