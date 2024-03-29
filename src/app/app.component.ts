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

  constructor(private fb: FormBuilder, private pokerEvalService: PokerEvalService) { }

  ngOnInit(): void {
    this.simulationForm = this.fb.group({
      numberOfSimulations: [
        '100,000,000'
      ],
      handsPerSession: [100, [Validators.min(1)]]
    });
  }

  runUthSimulation(): void {
    if (this.simulationForm.valid) {
      this.submitted = true;
      this.loading = true;
      this.errorMessage = '';
      this.simulation = undefined;
      this.executionTimeDisplay = '';
      const numberOfSimulations = +this.simulationForm.get('numberOfSimulations')?.value?.replaceAll(',', '');
      const handsPerSession = +this.simulationForm.get('handsPerSession')?.value?.replaceAll(',', '');
      this.simulationStatus = {
        currentSimulationNumber: 0,
        numberOfSimulations: numberOfSimulations
      }
      const simulationStatus$ = interval(1000).pipe(takeUntil(this.simulationCompleted)).subscribe(() => {
        this.pokerEvalService.getSimulationStatus().subscribe((simulationStatus) => {
          this.simulationStatus = simulationStatus;
        })
      });
      const start = window.performance.now();
      this.pokerEvalService.runUthSimulations(numberOfSimulations, handsPerSession).subscribe((simulationResults) => {
        this.profitPerSession = simulationResults.edge * handsPerSession;
        this.stDevPct = simulationResults.stDev / handsPerSession;
        this.simulation = simulationResults;
        const end = window.performance.now();
        this.executionTime = end - start;
        this.convertExecutionTime();
        this.loading = false;
        simulationStatus$.unsubscribe();
      }, (errorResp) => {
        this.simulationStatus = undefined;
        this.submitted = false;
        this.loading = false;
        this.errorMessage = errorResp && errorResp.error && errorResp.error.message || 'Server Error';
        simulationStatus$.unsubscribe();
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
    if (+removedNonNumbers > Math.pow(10, 9)) {
      removedNonNumbers = '' + Math.pow(10, 9);
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
