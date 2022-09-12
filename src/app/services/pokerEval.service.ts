import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { SimulationResults, SimulationStatus } from '../models/simulationResults';

@Injectable({ providedIn: 'root' })
export class PokerEvalService {

  constructor(private http: HttpClient) { }

  runUthSimulations(numberOfSimulations: number, handsPerSession: number): Observable<SimulationResults> {
    const requestBody = {
      numberOfSimulations,
      handsPerSession
    };
    return this.http.post<SimulationResults>
      ('http://localhost:3000/api/runUthSimulations', requestBody);
  }

  getSimulationStatus(): Observable<SimulationStatus> {
    const requestBody = {};
    return this.http.post<SimulationStatus>
      ('http://localhost:3000/api/getSimulationStatus', requestBody);
  }
}
