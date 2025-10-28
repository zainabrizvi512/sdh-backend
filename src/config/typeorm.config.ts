import { DataSource, DataSourceOptions } from 'typeorm';
import { config } from 'dotenv';
config();

export const dataSourceOptions: DataSourceOptions = {
    type: 'postgres',
    host: process.env.DB_HOST,
    port: +(process.env.DB_PORT || 5432),
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    entities: [__dirname + '/../**/*.entity.{ts,js}'],
    migrations: [__dirname + '/../migrations/*.{ts,js}'],
    // For development you can enable sync ONCE to generate the table quickly,
    // but prefer migrations in real projects.
    synchronize: true,
};

const dataSource = new DataSource(dataSourceOptions);
export default dataSource;
