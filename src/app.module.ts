import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { FaqModule } from './faq/faq.module';
import { StripeModule } from './stripe/stripe.module';
import { SupportModule } from './support/support.module';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@app/config';
import { redisStore } from 'cache-manager-redis-yet';
import { NewsletterModule } from './newsletter/newsletter.module';
import { APP_FILTER } from '@nestjs/core';
import { ValidationErrorFilter } from '@app/common/utils/error-handler/validation-error-filter';
import { ProductModule } from './product/product.module';
import { DatabaseModule } from '@app/database';
import { MediaModule } from '@app/media';
import { MailerModule } from '@app/mailer';
import { ContactModule } from './contact/contact.module';
import { AddressModule } from './address/address.module';
import { PropertyModule } from './property/property.module';
import { PropertyRequestModule } from './property-request/property-request.module';
import { AccompaniementModule } from './accompaniement/accompaniement.module';
import { AccompagniementRequestModule } from './accompagniement-request/accompagniement-request.module';
import { OrderModule } from './order/order.module';
import { AnalyticsModule } from './analytics/analytics.module';

@Module({
  imports: [
    UserModule,
    AuthModule,
    DatabaseModule,
    ConfigModule,
    MediaModule,
    MailerModule,
    FaqModule,
    NewsletterModule,
    StripeModule,
    SupportModule,
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        store: await redisStore({
          socket: {
            host: configService.get('REDIS_HOST'),
            port: configService.get('REDIS_PORT'),
          },
          password: configService.get('REDIS_PASSWORD'),
          ttl: 5 * 1000, //? milliseconds
        }),
      }),
    }),
    ProductModule,
    ContactModule,
    AddressModule,
    PropertyModule,
    PropertyRequestModule,
    AccompaniementModule,
    AccompagniementRequestModule,
    OrderModule,
    AnalyticsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_FILTER, useClass: ValidationErrorFilter },
  ],
})
export class AppModule {}
