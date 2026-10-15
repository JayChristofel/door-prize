export interface Participant {
  id: string;
  name: string;
  column: string | null;
  createdAt: string;
}

export interface Winner {
  id: string;
  participantId: string;
  name: string;
  round: number;
  column: string | null;
  createdAt: string;
}
