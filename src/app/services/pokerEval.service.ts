import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class PokerEvalService {

  constructor(private http: HttpClient) { }

  getPokerEval(player1Hand: number[], player2Hand: number[], flop: number[]): Observable<{
    player1Results: number[],
    player2Results: number[]
  }> {
    const requestBody = {
      player1Hand,
      player2Hand,
      flop
    };
    return this.http.post<{
      player1Results: number[],
      player2Results: number[]
    }
    >('http://localhost:3000/api/pokerEval', requestBody);
  }
}
