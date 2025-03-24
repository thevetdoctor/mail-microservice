export interface IDbConfigAttributes {
  username?: string;
  password?: string;
  database?: string;
  host?: string;
  port?: number | string;
  dialect?: string;
  urlDatabase?: string;
}

export interface IDbConfig {
  development: IDbConfigAttributes;
  test: IDbConfigAttributes;
  production: IDbConfigAttributes;
}
