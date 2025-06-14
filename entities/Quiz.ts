export enum QuestionType {
    SingleChoice = 'SingleCorrect',
    MultipleChoice = 'MultipleCorrect',
    Subjective = 'Subjective',
    FileAttach = 'File', // Corrected 'File' to 'FileAttach' for consistency if intended
}
export interface QuestionInput {
  type: QuestionType;
  text: string;
  points: number;
  negPoints: number;
  options: string[];
  correctAnswers: number[];
  answerText?: string;
  attachFileType?: string;
  attachFileURL?: string;
}

export interface CreateQuizInput {
  title: string;
  description: string;
  duration: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  creatorId: string;
  creatorName: string;
  courseId?: string | null;
  courseURL?: string | null;
  thumbURL?: string | null;
  price: number;
  backtrack: boolean;
  randomize: boolean;
  Tags?: string[] | null;
  Questions: QuestionInput[];
  currency: string;
}

export class QuizEntity {
  constructor(public readonly data: CreateQuizInput) {}
}
