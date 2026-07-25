export const faqMoveDirections = ["up", "down"] as const;

export type FaqMoveDirection = (typeof faqMoveDirections)[number];

export type FaqEntry = {
  id: string;
  question: string;
  answer: string;
  order: number;
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateFaqInput = {
  question: string;
  answer: string;
  createdBy: string;
  updatedBy: string;
};

export type UpdateFaqInput = {
  id: string;
  question: string;
  answer: string;
  updatedBy: string;
};

export type DeleteFaqInput = {
  id: string;
};

export type MoveFaqInput = {
  id: string;
  direction: FaqMoveDirection;
  updatedBy: string;
};
