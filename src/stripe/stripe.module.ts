import { Module } from '@nestjs/common';
import { StripeController } from './stripe.controller';
import { ConfigModule, ConfigService } from '@app/config';
import Stripe from 'stripe';
@Module({
  imports: [ConfigModule],
  controllers: [StripeController],
  providers: [
    {
      provide: 'STRIPE_CLIENT',
      useFactory: (configService: ConfigService) => {
        return new Stripe(configService.get<string>('STRIPE_SECRET_KEY'), {
          apiVersion: '2025-05-28.basil',
        });
      },
      inject: [ConfigService],
    },
  ],
  exports: ['STRIPE_CLIENT'],
})
export class StripeModule {}
