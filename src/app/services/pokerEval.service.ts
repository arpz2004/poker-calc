import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { SimulationResults } from '../models/simulationResults';

@Injectable({ providedIn: 'root' })
export class PokerEvalService {

  constructor(private http: HttpClient) { }

  runUthSimulations(): Observable<SimulationResults> {
    const requestBody = {};
    return this.http.post<SimulationResults>
      ('http://localhost:3000/api/runUthSimulations', requestBody);
  }
}
