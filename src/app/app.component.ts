import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SimulationResults } from './models/simulationResults';
import { PokerEvalService } from './services/pokerEval.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  simulationForm!: FormGroup;
  submitted = false;
  loading = false;
  simulation?: SimulationResults;

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
      this.pokerEvalService.runUthSimulations(this.simulationForm.get('numberOfSimulations')?.value).subscribe((val) => {
        this.simulation = val;
        this.loading = false;
      }, () => {
        this.submitted = false;
        this.loading = false;
      });
    }
  }
}
