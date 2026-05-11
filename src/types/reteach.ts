export interface ExitTicketQuestion {
  question: string;
  type: 'mcq' | 'short_answer';
  options?: string[];
  answer: string;
}

export interface ReteachCard {
  _id: string;
  topic: string;
  subtopic: string;
  avgMastery: number;
  difficultyScore: number;
  interventionScript: string;
  exitTicket: ExitTicketQuestion[];
  generatedAt: string;
}
