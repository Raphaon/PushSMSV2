export default class Tenant {

  constructor(id, name, slug, country, timezone, currency, status, createdAt, updatedAt) 
  {
    this.id = id;
    this.name = name;
    this.slug = slug;
    this.country = country;
    this.timezone = timezone;
    this.currency = currency;
    this.status = status;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  
}
