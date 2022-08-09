import { Component, OnDestroy, OnInit } from '@angular/core';
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
  submitted = false;
  loading = false;
  complete: Subject<void> = new Subject();
  simulation?: {
    playerCards: number[],
    communityCards: number[],
    dealerCards: number[],
    equity: number
  };
  cardArray: number[] = [];

  constructor(private fb: FormBuilder, private pokerEvalService: PokerEvalService) { }

  ngOnInit(): void {
    this.cardForm = this.fb.group({
      community: this.fb.group({
        card1: this.createCardControl(''),
        card2: this.createCardControl(''),
        card3: this.createCardControl(''),
        card4: this.createCardControl(''),
        card5: this.createCardControl('')
      }),
      player: this.fb.group({
        card1: this.createCardControl(''),
        card2: this.createCardControl('')
      }),
      dealer: this.fb.group({
        card1: this.createCardControl(''),
        card2: this.createCardControl('')
      })
    });
    this.cardForm.valueChanges.pipe(takeUntil(this.complete)).subscribe(val => {
      const communityCards: string[] = Object.keys(val.community).map(key => val.community[key]);
      const playerCards: string[] = Object.keys(val.player).map(key => val.player[key]);
      const dealerCards: string[] = Object.keys(val.dealer).map(key => val.dealer[key]);
      const cardStrings: string[] = communityCards.concat(playerCards, dealerCards);
      this.cardArray = cardStrings.map(card => cardNotationToInt(card));
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
    });
    return control;
  }

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

  ngOnDestroy(): void {
    this.complete.next();
    this.complete.complete();
  }
}
