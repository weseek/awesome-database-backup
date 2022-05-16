export const mysqlConfig = {
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQLL_PASSWORD || 'password',
  host: process.env.MYSQLL_HOST || 'mariadb',
  port: Number(process.env.MYSQL_PORT) || 3306,
};
