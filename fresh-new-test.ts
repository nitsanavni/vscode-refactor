// Fresh new test file for save functionality testing
class DataService {
  private users: string[];

  constructor() {
    this.users = [];
  }

  addUser(user: string): void {
    this.users.push(user);
  }

  getUsers(): string[] {
    return this.users;
  }
}

const manager = new DataService();
manager.addUser("alice");
const allUsers = manager.getUsers();

export { DataService as UserManager };
