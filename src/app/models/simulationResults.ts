export interface SimulationResults {
  playerCards: number[];
  communityCards: number[];
  dealerCards: number[];
  profit: number;
  edge: number;
  stDev: number;
};

export interface SimulationStatus {
  currentSimulationNumber: number;
  numberOfSimulations: number;
}
