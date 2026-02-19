export type ResourceType = 'energy' | 'scrap' | 'data' | 'steel' | 'electronics';

export interface ResourceState {
  energy: number;
  scrap: number;
  data: number;
  steel: number;
  electronics: number;
}

export class ResourceManager {
  state: ResourceState;

  constructor() {
    this.state = {
      energy: 50,
      scrap: 40, // Absoluter Startwert
      data: 0,
      steel: 0,
      electronics: 0
    };
  }

  canAfford(cost: Partial<ResourceState>): boolean {
    return (
      (cost.energy || 0) <= this.state.energy &&
      (cost.scrap || 0) <= this.state.scrap &&
      (cost.data || 0) <= this.state.data &&
      (cost.steel || 0) <= this.state.steel &&
      (cost.electronics || 0) <= this.state.electronics
    );
  }

  spend(cost: Partial<ResourceState>) {
    this.state.energy -= cost.energy || 0;
    this.state.scrap -= cost.scrap || 0;
    this.state.data -= cost.data || 0;
    this.state.steel -= cost.steel || 0;
    this.state.electronics -= cost.electronics || 0;
  }

  add(income: Partial<ResourceState>) {
    this.state.energy += income.energy || 0;
    this.state.scrap += income.scrap || 0;
    this.state.data += income.data || 0;
    this.state.steel += income.steel || 0;
    this.state.electronics += income.electronics || 0;
  }
}
