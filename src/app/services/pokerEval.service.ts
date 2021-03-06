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

  getEquitiesWhenCalling(player1Hand: number[]): Observable<{
    equitiesWhenCalling: number[],
    totalEquities: number
  }> {
    const requestBody = {
      player1Hand
    };
    return this.http.post<{
      equitiesWhenCalling: number[],
      totalEquities: number
    }
    >('http://localhost:3000/api/getEquitiesWhenCalling', requestBody);
  }
}
