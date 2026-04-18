export class User {
  
  constructor(data) {
    this.id = data.id;
    this.tenantId = data.tenantId;
    this.firstName = data.firstName;
    this.lastName = data.lastName;
    this.email = data.email;
    this.phone = data.phone;
    this.passwordHash = data.passwordHash;
    this.role = data.role;
    this.status = data.status;
    this.lastLoginAt = data.lastLoginAt;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }

}