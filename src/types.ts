export type CardType = 'base' | 'composite';
export type CardSubtype = 'character' | 'talent';

export interface Card {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  type: CardType;
  subtype: CardSubtype | null;
  parent_a_id: string | null;
  parent_b_id: string | null;
  parent_c_id: string | null;
  source_question_id: string | null;
  created_at: string;
}

export interface Candidate {
  name: string;
  description: string;
  subtype?: CardSubtype;
}
