export const mariadbConfig = {
  user: process.env.MARIADB_USER || 'root',
  password: process.env.MARIADB_PASSWORD || 'password',
  host: process.env.MARIADB_HOST || 'mariadb',
  port: Number(process.env.MARIADB_PORT) || 3306,
};
