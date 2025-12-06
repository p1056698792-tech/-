export enum TreeMode {
  CLASSIC = 'CLASSIC',
  MODERN = 'MODERN',
  ROYAL = 'ROYAL'
}

export interface WishState {
  recipient: string;
  message: string;
  loading: boolean;
  error: string | null;
}

export interface LightConfig {
  intensity: number;
  color: string;
}