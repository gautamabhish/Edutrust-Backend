export enum Role {
    Default,
    Admin,
    SuperAdmin,
  }
  
  export class User {
    constructor(
      public id: string,
      public name: string,
      public email: string,
      public createdAt: Date = new Date(),
      public role: Role ,
      private password: string
    ) {}
  
    getPassword() {
      return this.password;
    }
  }
  