import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { SimulationResults } from '../models/simulationResults';

@Injectable({ providedIn: 'root' })
export class PokerEvalService {

  constructor(private http: HttpClient) { }

  runUthSimulations(numberOfSimulations: number): Observable<SimulationResults> {
    const requestBody = {
      numberOfSimulations
    };
    return this.http.post<SimulationResults>
      ('http://localhost:3000/api/runUthSimulations', requestBody);
  }
}
