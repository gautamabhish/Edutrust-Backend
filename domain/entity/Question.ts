export enum QuestionType {
  SingleChoice = "SingleChoice",
  MultipleChoice = "MultipleChoice",
  Subjective = "Subjective",
  File = "File",
}

export class Question {
  public id: string;
  public quizId: string;
  public type: QuestionType;
  public text: string;
  public points: number;
  public options: any; // Consider defining a better type for structured option data
  public correctAnswers: any; // Also consider better typing here
  public answerText?: string;
  public attachFileType?: string;
  public attachFileURL?: string;

  constructor(
    id: string,
    quizId: string,
    type: QuestionType,
    text: string,
    points: number,
    options: any,
    correctAnswers: any,
    answerText?: string,
    attachFileType?: string,
    attachFileURL?: string
  ) {
    this.id = id;
    this.quizId = quizId;
    this.type = type;
    this.text = text;
    this.points = points;
    this.options = options;
    this.correctAnswers = correctAnswers;
    this.answerText = answerText;
    this.attachFileType = attachFileType;
    this.attachFileURL = attachFileURL;
  }
}
