export const mariadbConfig = {
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || 'password',
  host: process.env.MYSQL_HOST || 'mariadb',
  port: Number(process.env.MYSQL_PORT) || 3306,
};
