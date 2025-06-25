// domain/entity/User.ts
export enum Role {
  Default = "Default",
  Admin = "Admin",
  SuperAdmin = "SuperAdmin",
}

export class User {
  constructor(
    public id: string,
    public name: string,
    public email: string,
    private password: string,
    public otp: string,
    public otpExpires: Date = new Date(Date.now() + 10 * 60 * 1000), // 10 minutes from now
    public isVerified: boolean = false,
    public createdAt: Date = new Date(),
    public role: Role = Role.Default
  ) {}

  getPassword(): string {
    return this.password;
  }

  validatePassword(input: string): boolean {
    return input === this.password;
  }

}
