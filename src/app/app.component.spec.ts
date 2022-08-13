import { TestBed } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { of } from 'rxjs';
import { AppComponent } from './app.component';
import { PokerEvalService } from './services/pokerEval.service';

describe('AppComponent', () => {
  beforeEach(async () => {
    const pokerEvalService = jasmine.createSpyObj('PokerEvalService', ['runUthSimulations']);
    pokerEvalService.runUthSimulations.and.returnValue(of({
      playerCards: [],
      communityCards: [],
      dealerCards: [],
      profit: 0,
      edge: 0
    }))
    await TestBed.configureTestingModule({
      imports: [FormsModule, ReactiveFormsModule],
      declarations: [
        AppComponent
      ],
      providers: [{ provide: PokerEvalService, useValue: pokerEvalService }]
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it(`should have as title 'poker-calc'`, () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app.title).toEqual('poker-calc');
  });

});
