import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class PokerEvalService {

  constructor(private http: HttpClient) { }

  getEquity(player1Hand: number[], player2Hand: number[], flop: number[], beatTheDealerMode: boolean): Observable<number> {
    const requestBody = {
      player1Hand,
      player2Hand,
      flop,
      beatTheDealerMode
    };
    return this.http.post<{
      equity: number
    }
    >('http://localhost:3000/api/getEquity', requestBody).pipe(
      map(val => val.equity)
    );
  }

  runUthSimulations(): Observable<{}> {
    const requestBody = {};
    return this.http.post<{}>
      ('http://localhost:3000/api/runUthSimulations', requestBody);
  }
}
