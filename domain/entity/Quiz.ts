
export enum difficulty {
  Easy,
  Medium,
  Hard

}
export class Quiz {

  constructor(

    public creatorId: string,
     public title: string, 
     public description: string,
    public visibleToPublic: boolean,
    public difficulty: difficulty, 
    public courseId?: string) { }
}