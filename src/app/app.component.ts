import { CurrencyPipe } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { interval, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { SimulationResults, SimulationStatus } from './models/simulationResults';
import { PokerEvalService } from './services/pokerEval.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {
  simulationForm!: FormGroup;
  submitted = false;
  loading = false;
  simulation?: SimulationResults;
  simulationStatus?: SimulationStatus;
  simulationCompleted = new Subject<void>();
  executionTime = 0;
  executionTimeDisplay = '';
  errorMessage = '';
  profitPerSession = 0;
  stDevPct = 0;
  lastProgressUpdate = 0; // Track last progress to prevent race conditions
  lastProgressTime = 0; // Track when last progress was received
  progressRate = 0; // Track rate of progress for interpolation

  constructor(private fb: FormBuilder, private pokerEvalService: PokerEvalService) { }

  ngOnInit(): void {
    this.simulationForm = this.fb.group({
      numberOfSimulations: [
        '100,000,000'
      ],
      handsPerSession: [100, [Validators.min(1)]],
      knownDealerCards: [0, [Validators.min(0), Validators.max(2)]],
      knownFlopCards: [0, [Validators.min(0), Validators.max(3)]],
      knownTurnRiverCards: [0, [Validators.min(0), Validators.max(2)]],
      excludeFishyPlays: [false]
    });
  }

  runUthSimulation(): void {
    if (this.simulationForm.valid) {
      this.submitted = true;
      this.loading = true;
      this.errorMessage = '';
      this.simulation = undefined;
      this.executionTimeDisplay = '';
      const numberOfSimulations = +String(this.simulationForm.get('numberOfSimulations')!.value || '0').replace(/,/g, '');
      const handsPerSession = +String(this.simulationForm.get('handsPerSession')!.value || '0').replace(/,/g, '');
      const knownDealerCards = +this.simulationForm.get('knownDealerCards')!.value;
      const knownFlopCards = +this.simulationForm.get('knownFlopCards')!.value;
      const knownTurnRiverCards = +this.simulationForm.get('knownTurnRiverCards')!.value;
      const excludeFishyPlays = this.simulationForm.get('excludeFishyPlays')!.value || false;
      this.simulationStatus = {
        currentSimulationNumber: 0,
        numberOfSimulations: numberOfSimulations
      }
      this.lastProgressUpdate = 0; // Reset progress tracking
      this.lastProgressTime = Date.now(); // Reset time tracking
      this.progressRate = 0; // Reset progress rate
      
      // Use simple fixed polling with race condition prevention
      const simulationStatus$ = interval(3000).pipe(takeUntil(this.simulationCompleted)).subscribe(() => {
        this.pokerEvalService.getSimulationStatus().subscribe((simulationStatus) => {
          // Only update if the new progress is higher than the last update (prevents race conditions)
          if (simulationStatus.currentSimulationNumber >= this.lastProgressUpdate) {
            // Calculate progress rate for interpolation
            const currentTime = Date.now();
            const timeDiff = currentTime - this.lastProgressTime;
            const progressDiff = simulationStatus.currentSimulationNumber - this.lastProgressUpdate;
            
            if (timeDiff > 0 && progressDiff > 0) {
              this.progressRate = progressDiff / timeDiff; // Rate: simulations per millisecond
            }
            
            this.simulationStatus = simulationStatus;
            this.lastProgressUpdate = simulationStatus.currentSimulationNumber;
            this.lastProgressTime = currentTime;
          }
        })
      });
      
      // Client-side progress interpolation for smoother UI
      const interpolationInterval$ = interval(100).pipe(takeUntil(this.simulationCompleted)).subscribe(() => {
        if (this.simulationStatus && this.progressRate > 0 && this.lastProgressUpdate < this.simulationStatus.numberOfSimulations) {
          const currentTime = Date.now();
          const timeSinceLastUpdate = currentTime - this.lastProgressTime;
          
          // Estimate current progress based on rate
          const estimatedProgress = Math.min(
            this.lastProgressUpdate + (this.progressRate * timeSinceLastUpdate),
            this.simulationStatus.numberOfSimulations
          );
          
          // Update display with interpolated progress
          this.simulationStatus = {
            currentSimulationNumber: Math.floor(estimatedProgress),
            numberOfSimulations: this.simulationStatus.numberOfSimulations
          };
        }
      });
      
      const start = window.performance.now();
      this.pokerEvalService.runUthSimulations(numberOfSimulations, handsPerSession, knownDealerCards, knownFlopCards, knownTurnRiverCards, excludeFishyPlays).subscribe((simulationResults) => {
        this.profitPerSession = simulationResults.edge * handsPerSession;
        this.stDevPct = simulationResults.stDev / handsPerSession;
        this.simulation = simulationResults;
        const end = window.performance.now();
        this.executionTime = end - start;
        this.convertExecutionTime();
        this.loading = false;
        simulationStatus$.unsubscribe();
        interpolationInterval$.unsubscribe();
      }, (errorResp) => {
        this.simulationStatus = undefined;
        this.submitted = false;
        this.loading = false;
        this.errorMessage = errorResp && errorResp.error && errorResp.error.message || 'Server Error';
        simulationStatus$.unsubscribe();
        interpolationInterval$.unsubscribe();
      });
    }
  }

  convertExecutionTime() {
    const diff = this.executionTime;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const arrival = new Date(+today + diff);
    let maxTimeLengths = 2;
    const duration = ['getFullYear', 'getMonth', 'getDate', 'getHours', 'getMinutes', 'getSeconds', 'getMilliseconds'].reduce((p, c) => {
      const value = (arrival[c as keyof Date] as () => number)() - (today[c as keyof Date] as () => number)();
      if (value && maxTimeLengths--) {
        p += value;
        let timeLength;
        switch (c) {
          case 'getFullYear':
            timeLength = 'Years'
            break;
          case 'getDate':
            timeLength = 'Days'
            break;
          case 'getMonth':
            timeLength = 'Months'
            break;
          default:
            timeLength = c.replace('get', '');
        }
        if (value === 1 && timeLength.endsWith('s')) {
          timeLength = timeLength.slice(0, -1);
        }
        p += ' ' + timeLength + (c === 'getMilliseconds' ? '' : ' ')
      }
      return p;
    }, '');
    this.executionTimeDisplay = duration.trim();
  }

  onFormControlChange(controlName: string, value: string) {
    const ctrl = this.simulationForm.get(controlName) as FormControl;
    let removedNonNumbers = value.replace(/\D/g, '');
    // Limit to 100 billion maximum for stability
    if (+removedNonNumbers > Math.pow(10, 11)) {
      removedNonNumbers = '' + Math.pow(10, 11);
    }
    if (+removedNonNumbers === 0) {
      ctrl.setValue('', { emitEvent: false, emitViewToModelChange: false });
    } else {
      ctrl.setValue((+removedNonNumbers).toLocaleString(), { emitEvent: false, emitViewToModelChange: false });
    }
  }

  ngOnDestroy() {
    this.simulationCompleted.next();
    this.simulationCompleted.complete();
  }
}
