export const postgresqlConfig = {
  user: process.env.POSTGRESQL_USER || 'postgres',
  password: process.env.POSTGRESQL_PASSWORD || 'password',
  host: process.env.POSTGRESQL_HOST || 'postgres',
  port: Number(process.env.POSTGRESQL_PORT) || 5432,
};
