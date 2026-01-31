
export type Language = 'en' | 'pl';

export interface Player {
  id: string;
  name: string;
  level: number;
  gear: number;
  gender: string;
  class: string;
  secondaryClass?: string;
  race: string;
  secondaryRace?: string;
  isHalfBreed?: boolean;
  isSuper?: boolean;
  avatar?: string;
}

export interface GameLog {
  id: string;
  timestamp: number;
  message: string;
  type: 'info' | 'success' | 'warning' | 'danger';
}

export interface BattleState {
  active: boolean;
  monsterLevel: number;
  monsterBonus: number;
  selectedPlayerIds: string[];
  playerBonuses: Record<string, number>;
}
