import { ApiProperty } from '@nestjs/swagger';

export class PropertyAnalyticsDto {
  @ApiProperty()
  total: number;

  @ApiProperty()
  featured: number;

  @ApiProperty()
  notFeatured: number;

  @ApiProperty()
  averagePrice: number;

  @ApiProperty()
  minPrice: number;

  @ApiProperty()
  maxPrice: number;
}

export class RequestAnalyticsDto {
  @ApiProperty()
  total: number;

  @ApiProperty()
  pending: number;

  @ApiProperty()
  accepted: number;

  @ApiProperty()
  rejected: number;

  @ApiProperty()
  cancelled: number;

  @ApiProperty()
  conversionRate: number;
}

export class PropertyRequestAnalyticsDto extends RequestAnalyticsDto {
  @ApiProperty()
  shipped: number;
}

export class AccompaniementAnalyticsDto {
  @ApiProperty()
  total: number;

  @ApiProperty()
  averagePrice: number;

  @ApiProperty()
  minPrice: number;

  @ApiProperty()
  maxPrice: number;
}

export class ProductStatsDto {
  @ApiProperty()
  averagePrice: number;

  @ApiProperty()
  minPrice: number;

  @ApiProperty()
  maxPrice: number;
}

export class ProductAnalyticsDto {
  @ApiProperty()
  total: number;

  @ApiProperty()
  books: number;

  @ApiProperty()
  products: number;

  @ApiProperty()
  featured: number;

  @ApiProperty()
  withDiscount: number;

  @ApiProperty()
  categoriesCount: number;

  @ApiProperty({ type: ProductStatsDto })
  productStats: ProductStatsDto;

  @ApiProperty({ type: ProductStatsDto })
  bookStats: ProductStatsDto;
}

export class OrderAnalyticsDto {
  @ApiProperty()
  total: number;

  @ApiProperty()
  paid: number;

  @ApiProperty()
  unpaid: number;

  @ApiProperty()
  pending: number;

  @ApiProperty()
  accepted: number;

  @ApiProperty()
  rejected: number;

  @ApiProperty()
  cancelled: number;

  @ApiProperty()
  shipped: number;

  @ApiProperty()
  productOrders: number;

  @ApiProperty()
  bookOrders: number;

  @ApiProperty()
  paidProductOrders: number;

  @ApiProperty()
  paidBookOrders: number;

  @ApiProperty()
  paymentRate: number;

  @ApiProperty()
  fulfillmentRate: number;
}

export class SupportAnalyticsDto {
  @ApiProperty()
  total: number;

  @ApiProperty()
  answered: number;

  @ApiProperty()
  unanswered: number;

  @ApiProperty()
  seen: number;

  @ApiProperty()
  unseen: number;

  @ApiProperty()
  clientTickets: number;

  @ApiProperty()
  visitorTickets: number;

  @ApiProperty()
  responseRate: number;
}

export class RevenueAnalyticsDto {
  @ApiProperty()
  totalRevenue: number;

  @ApiProperty()
  productRevenue: number;

  @ApiProperty()
  bookRevenue: number;

  @ApiProperty()
  paidOrdersRevenue: number;

  @ApiProperty()
  pendingRevenue: number;
}

export class ActivityPeriodDto {
  @ApiProperty()
  newProperties: number;

  @ApiProperty()
  newOrders: number;

  @ApiProperty()
  newSupportTickets: number;

  @ApiProperty()
  newPropertyRequests: number;
}

export class RecentActivityAnalyticsDto {
  @ApiProperty({ type: ActivityPeriodDto })
  last30Days: ActivityPeriodDto;

  @ApiProperty({ type: ActivityPeriodDto })
  last7Days: ActivityPeriodDto;
}

export class SummaryDto {
  @ApiProperty()
  totalProperties: number;

  @ApiProperty()
  totalProducts: number;

  @ApiProperty()
  totalOrders: number;

  @ApiProperty()
  totalRevenue: number;

  @ApiProperty()
  pendingRequests: number;

  @ApiProperty()
  unreadSupport: number;
}

export class AnalyticsResponseDto {
  @ApiProperty({ type: PropertyAnalyticsDto })
  properties: PropertyAnalyticsDto;

  @ApiProperty({ type: PropertyRequestAnalyticsDto })
  propertyRequests: PropertyRequestAnalyticsDto;

  @ApiProperty({ type: AccompaniementAnalyticsDto })
  accompaniements: AccompaniementAnalyticsDto;

  @ApiProperty({ type: RequestAnalyticsDto })
  accompaniementRequests: RequestAnalyticsDto;

  @ApiProperty({ type: ProductAnalyticsDto })
  products: ProductAnalyticsDto;

  @ApiProperty({ type: OrderAnalyticsDto })
  orders: OrderAnalyticsDto;

  @ApiProperty({ type: SupportAnalyticsDto })
  support: SupportAnalyticsDto;

  @ApiProperty({ type: RevenueAnalyticsDto })
  revenue: RevenueAnalyticsDto;

  @ApiProperty({ type: RecentActivityAnalyticsDto })
  recentActivity: RecentActivityAnalyticsDto;

  @ApiProperty({ type: SummaryDto })
  summary: SummaryDto;
}
