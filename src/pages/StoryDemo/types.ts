export type Scene =
  | 'idle' | 'dashboard' | 'bell-ping' | 'cursor-to-bell' | 'notification' | 'perf-glow'
  | 'perf-panel' | 'twin-panel' | 'phone'
  | 'outcome' | 'fading';

export type FoldPhase = 'idle' | 'folding' | 'exit';
export type SwapPhase = 'none' | 'folding' | 'exit' | 'flash' | 'phone-in';
export type KbMode = 'abc' | 'emoji';

export interface LaptopShellProps {
  children: React.ReactNode;
  foldPhase?: FoldPhase;
}

export interface DashboardProps {
  perfGlowing?: boolean;
  twinGlowing?: boolean;
  twinCardHidden?: boolean;
  perfCardHidden?: boolean;
  bellActive?: boolean;
  bellHiddenInHeader?: boolean;
}

export interface WaMessage {
  id: number;
  from: 'kundai' | 'tapiwa';
  text: string;
  time: string;
  typed: string;
  done: boolean;
  partial?: boolean;
}

export interface KeyPress {
  row: number;
  col: number;
  key: string;
  ts: number;
}
