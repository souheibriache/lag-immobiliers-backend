import { Module } from '@nestjs/common';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@app/config';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (
        configService: ConfigService,
      ): Promise<TypeOrmModuleOptions> => {
        const env = configService.get<'development' | 'production' | 'test'>(
          'NODE_ENV',
        );

        const dbConfig =
          env === 'development'
            ? {
                host: configService.get<string>('DEV_DB_HOST'),
                port: configService.get<number>('DEV_DB_PORT'),
                username: configService.get<string>('DEV_DB_USER'),
                password: configService.get<string>('DEV_DB_PASSWORD'),
                database: configService.get<string>('DEV_DB_NAME'),
              }
            : {
                host: configService.get<string>('DB_HOST'),
                port: configService.get<number>('DB_PORT'),
                username: configService.get<string>('DB_USER'),
                password: configService.get<string>('DB_PASSWORD'),
                database: configService.get<string>('DB_NAME'),
              };

        return {
          type: 'postgres',
          autoLoadEntities: true,
          // ssl: {
          //   rejectUnauthorized: true,
          //   ca: fs.readFileSync(path.resolve("ca.pem"), 'utf8'),
          // },
          synchronize: true,
          logging: false,
          migrationsTableName: 'migrations_typeorm',
          migrationsRun: true,
          ...dbConfig,
        };
      },
    }),
  ],
})
export class DatabaseModule {}
