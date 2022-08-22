import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
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

  constructor(private fb: FormBuilder, private pokerEvalService: PokerEvalService) { }

  ngOnInit(): void {
    this.simulationForm = this.fb.group({
      numberOfSimulations: [
        '100000000',
        [
          Validators.min(1),
          Validators.max(1000000000),
          Validators.pattern('^[0-9]*[1-9][0-9]*$')
        ]
      ]
    });
  }

  runUthSimulation(): void {
    if (this.simulationForm.valid) {
      this.submitted = true;
      this.loading = true;
      this.simulation = undefined;
      this.executionTimeDisplay = '';
      const numberOfSimulations = this.simulationForm.get('numberOfSimulations')?.value;
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
      this.pokerEvalService.runUthSimulations(numberOfSimulations).subscribe((simulationResults) => {
        this.simulation = simulationResults;
        const end = window.performance.now();
        this.executionTime = end - start;
        this.convertExecutionTime();
        this.loading = false;
        simulationStatus$.unsubscribe();
      }, () => {
        this.submitted = false;
        this.loading = false;
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

  ngOnDestroy() {
    this.simulationCompleted.next();
    this.simulationCompleted.complete();
  }
}
