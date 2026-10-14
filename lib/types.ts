export interface Participant {
  id: string;
  name: string;
  createdAt: string;
}

export interface Winner {
  id: string;
  participantId: string;
  name: string;
  round: number;
  createdAt: string;
}
