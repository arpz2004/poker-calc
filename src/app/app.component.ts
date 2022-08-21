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
      const simulationStatus$ = interval(200).pipe(takeUntil(this.simulationCompleted)).subscribe(() => {
        this.pokerEvalService.getSimulationStatus().subscribe((simulationStatus) => {
          this.simulationStatus = simulationStatus;
        })
      });
      this.pokerEvalService.runUthSimulations(this.simulationForm.get('numberOfSimulations')?.value).subscribe((simulationResults) => {
        this.simulation = simulationResults;
        this.loading = false;
        simulationStatus$.unsubscribe();
      }, () => {
        this.submitted = false;
        this.loading = false;
        simulationStatus$.unsubscribe();
      });
    }
  }

  ngOnDestroy() {
    this.simulationCompleted.next();
    this.simulationCompleted.complete();
  }
}
