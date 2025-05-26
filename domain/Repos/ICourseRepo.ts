export interface ICourseRepo {
    create(course: Course): Promise<void>;  
    findByUrl(url: string): Promise<Course | null>;
    addQuiz(courseId: string, quizId: string): Promise<void>;
    removeQuiz(courseId: string, quizId: string): Promise<void>;
   
    findAll(): Promise<Course[]>;
}