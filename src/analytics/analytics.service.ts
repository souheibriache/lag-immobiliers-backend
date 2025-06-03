import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Property } from 'src/property/entities/property.entity';
import { PropertyRequest } from 'src/property-request/entities/property-request.entity';
import { Accompaniement } from 'src/accompaniement/entities/accompaniement.entity';
import { AccompagniementRequest } from 'src/accompagniement-request/entities/accompagniement-request.entity';
import { Product } from 'src/product/entities/product.entity';
import { RequestStatusEnum } from 'src/property-request/enums/request-status.enum';
import { ProductTypeEnum } from 'src/product/enums/product-type.enum';
import { SupportCategory } from 'src/support/enums/support-category.enum';
import { AnalyticsResponseDto } from './dto/analytics-response.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Order } from 'src/order/entities/order.entity';
import { Support } from 'src/support/entities';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(Property)
    private readonly propertyRepo: Repository<Property>,
    @InjectRepository(PropertyRequest)
    private readonly propertyRequestRepo: Repository<PropertyRequest>,
    @InjectRepository(Accompaniement)
    private readonly accompaniementRepo: Repository<Accompaniement>,
    @InjectRepository(AccompagniementRequest)
    private readonly accompaniementRequestRepo: Repository<AccompagniementRequest>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    @InjectRepository(Support)
    private readonly supportRepo: Repository<Support>,
  ) {}

  async getComprehensiveAnalytics(): Promise<AnalyticsResponseDto> {
    const [
      propertyAnalytics,
      propertyRequestAnalytics,
      accompaniementAnalytics,
      accompaniementRequestAnalytics,
      productAnalytics,
      orderAnalytics,
      supportAnalytics,
      revenueAnalytics,
      recentActivityAnalytics,
    ] = await Promise.all([
      this.getPropertyAnalytics(),
      this.getPropertyRequestAnalytics(),
      this.getAccompaniementAnalytics(),
      this.getAccompaniementRequestAnalytics(),
      this.getProductAnalytics(),
      this.getOrderAnalytics(),
      this.getSupportAnalytics(),
      this.getRevenueAnalytics(),
      this.getRecentActivityAnalytics(),
    ]);

    return {
      properties: propertyAnalytics,
      propertyRequests: propertyRequestAnalytics,
      accompaniements: accompaniementAnalytics,
      accompaniementRequests: accompaniementRequestAnalytics,
      products: productAnalytics,
      orders: orderAnalytics,
      support: supportAnalytics,
      revenue: revenueAnalytics,
      recentActivity: recentActivityAnalytics,
      summary: {
        totalProperties: propertyAnalytics.total,
        totalProducts: productAnalytics.total,
        totalOrders: orderAnalytics.total,
        totalRevenue: revenueAnalytics.totalRevenue,
        pendingRequests:
          propertyRequestAnalytics.pending +
          accompaniementRequestAnalytics.pending,
        unreadSupport: supportAnalytics.unseen,
      },
    };
  }

  private async getPropertyAnalytics() {
    const [total, featured, priceStats] = await Promise.all([
      this.propertyRepo.count(),
      this.propertyRepo.count({ where: { isFeatured: true } }),
      this.propertyRepo
        .createQueryBuilder('property')
        .leftJoin('property.price', 'price')
        .select([
          'AVG(price.monthlyPrice) as avgPrice',
          'MIN(price.monthlyPrice) as minPrice',
          'MAX(price.monthlyPrice) as maxPrice',
        ])
        .getRawOne(),
    ]);

    return {
      total,
      featured,
      notFeatured: total - featured,
      averagePrice: Number.parseFloat(priceStats?.avgPrice || '0'),
      minPrice: Number.parseFloat(priceStats?.minPrice || '0'),
      maxPrice: Number.parseFloat(priceStats?.maxPrice || '0'),
    };
  }

  private async getPropertyRequestAnalytics() {
    const [total, pending, accepted, rejected, cancelled, shipped] =
      await Promise.all([
        this.propertyRequestRepo.count(),
        this.propertyRequestRepo.count({
          where: { status: RequestStatusEnum.PENDING },
        }),
        this.propertyRequestRepo.count({
          where: { status: RequestStatusEnum.ACCEPTED },
        }),
        this.propertyRequestRepo.count({
          where: { status: RequestStatusEnum.REJECTED },
        }),
        this.propertyRequestRepo.count({
          where: { status: RequestStatusEnum.CANCELLED },
        }),
        this.propertyRequestRepo.count({
          where: { status: RequestStatusEnum.SHIPPED },
        }),
      ]);

    return {
      total,
      pending,
      accepted,
      rejected,
      cancelled,
      shipped,
      conversionRate:
        total > 0
          ? Number.parseFloat(((accepted / total) * 100).toFixed(2))
          : 0,
    };
  }

  private async getAccompaniementAnalytics() {
    const [total, priceStats] = await Promise.all([
      this.accompaniementRepo.count(),
      this.accompaniementRepo
        .createQueryBuilder('accompaniement')
        .select([
          'AVG(accompaniement.price) as avgPrice',
          'MIN(accompaniement.price) as minPrice',
          'MAX(accompaniement.price) as maxPrice',
        ])
        .getRawOne(),
    ]);

    return {
      total,
      averagePrice: Number.parseFloat(priceStats?.avgPrice || '0'),
      minPrice: Number.parseFloat(priceStats?.minPrice || '0'),
      maxPrice: Number.parseFloat(priceStats?.maxPrice || '0'),
    };
  }

  private async getAccompaniementRequestAnalytics() {
    const [total, pending, accepted, rejected, cancelled] = await Promise.all([
      this.accompaniementRequestRepo.count(),
      this.accompaniementRequestRepo.count({
        where: { status: RequestStatusEnum.PENDING },
      }),
      this.accompaniementRequestRepo.count({
        where: { status: RequestStatusEnum.ACCEPTED },
      }),
      this.accompaniementRequestRepo.count({
        where: { status: RequestStatusEnum.REJECTED },
      }),
      this.accompaniementRequestRepo.count({
        where: { status: RequestStatusEnum.CANCELLED },
      }),
    ]);

    return {
      total,
      pending,
      accepted,
      rejected,
      cancelled,
      conversionRate:
        total > 0
          ? Number.parseFloat(((accepted / total) * 100).toFixed(2))
          : 0,
    };
  }

  private async getProductAnalytics() {
    const [
      total,
      totalBooks,
      totalProducts,
      featured,
      withDiscount,
      productPriceStats,
      bookPriceStats,
      categoriesCount,
    ] = await Promise.all([
      this.productRepo.count(),
      this.productRepo.count({ where: { type: ProductTypeEnum.BOOK } }),
      this.productRepo.count({ where: { type: ProductTypeEnum.PRODUCT } }),
      this.productRepo.count({ where: { isFeatured: true } }),
      this.productRepo
        .createQueryBuilder('product')
        .where('product.discount > 0')
        .getCount(),
      this.productRepo
        .createQueryBuilder('product')
        .where('product.type = :type', { type: ProductTypeEnum.PRODUCT })
        .select([
          'AVG(product.price) as avgPrice',
          'MIN(product.price) as minPrice',
          'MAX(product.price) as maxPrice',
        ])
        .getRawOne(),
      this.productRepo
        .createQueryBuilder('product')
        .where('product.type = :type', { type: ProductTypeEnum.BOOK })
        .select([
          'AVG(product.price) as avgPrice',
          'MIN(product.price) as minPrice',
          'MAX(product.price) as maxPrice',
        ])
        .getRawOne(),
      this.productRepo
        .createQueryBuilder('product')
        .leftJoin('product.category', 'category')
        .select('COUNT(DISTINCT category.id)', 'count')
        .getRawOne(),
    ]);

    return {
      total,
      books: totalBooks,
      products: totalProducts,
      featured,
      withDiscount,
      categoriesCount: Number.parseInt(categoriesCount?.count || '0'),
      productStats: {
        averagePrice: Number.parseFloat(productPriceStats?.avgPrice || '0'),
        minPrice: Number.parseFloat(productPriceStats?.minPrice || '0'),
        maxPrice: Number.parseFloat(productPriceStats?.maxPrice || '0'),
      },
      bookStats: {
        averagePrice: Number.parseFloat(bookPriceStats?.avgPrice || '0'),
        minPrice: Number.parseFloat(bookPriceStats?.minPrice || '0'),
        maxPrice: Number.parseFloat(bookPriceStats?.maxPrice || '0'),
      },
    };
  }

  private async getOrderAnalytics() {
    const [
      total,
      paid,
      unpaid,
      pending,
      accepted,
      rejected,
      cancelled,
      shipped,
      productOrders,
      bookOrders,
      paidProductOrders,
      paidBookOrders,
    ] = await Promise.all([
      this.orderRepo.count(),
      this.orderRepo.count({ where: { isPaid: true } }),
      this.orderRepo.count({ where: { isPaid: false } }),
      this.orderRepo.count({ where: { status: RequestStatusEnum.PENDING } }),
      this.orderRepo.count({ where: { status: RequestStatusEnum.ACCEPTED } }),
      this.orderRepo.count({ where: { status: RequestStatusEnum.REJECTED } }),
      this.orderRepo.count({ where: { status: RequestStatusEnum.CANCELLED } }),
      this.orderRepo.count({ where: { status: RequestStatusEnum.SHIPPED } }),
      this.orderRepo
        .createQueryBuilder('order')
        .leftJoin('order.product', 'product')
        .where('product.type = :type', { type: ProductTypeEnum.PRODUCT })
        .getCount(),
      this.orderRepo
        .createQueryBuilder('order')
        .leftJoin('order.product', 'product')
        .where('product.type = :type', { type: ProductTypeEnum.BOOK })
        .getCount(),
      this.orderRepo
        .createQueryBuilder('order')
        .leftJoin('order.product', 'product')
        .where('product.type = :type AND order.isPaid = :isPaid', {
          type: ProductTypeEnum.PRODUCT,
          isPaid: true,
        })
        .getCount(),
      this.orderRepo
        .createQueryBuilder('order')
        .leftJoin('order.product', 'product')
        .where('product.type = :type AND order.isPaid = :isPaid', {
          type: ProductTypeEnum.BOOK,
          isPaid: true,
        })
        .getCount(),
    ]);

    return {
      total,
      paid,
      unpaid,
      pending,
      accepted,
      rejected,
      cancelled,
      shipped,
      productOrders,
      bookOrders,
      paidProductOrders,
      paidBookOrders,
      paymentRate:
        total > 0 ? Number.parseFloat(((paid / total) * 100).toFixed(2)) : 0,
      fulfillmentRate:
        total > 0 ? Number.parseFloat(((shipped / total) * 100).toFixed(2)) : 0,
    };
  }

  private async getSupportAnalytics() {
    const [
      total,
      answered,
      unanswered,
      seen,
      unseen,
      clientTickets,
      visitorTickets,
    ] = await Promise.all([
      this.supportRepo.count(),
      this.supportRepo
        .createQueryBuilder('support')
        .where('support.answeredAt IS NOT NULL')
        .getCount(),
      this.supportRepo
        .createQueryBuilder('support')
        .where('support.answeredAt IS NULL')
        .getCount(),
      this.supportRepo
        .createQueryBuilder('support')
        .where('support.seenAt IS NOT NULL')
        .getCount(),
      this.supportRepo
        .createQueryBuilder('support')
        .where('support.seenAt IS NULL')
        .getCount(),
      this.supportRepo.count({ where: { category: SupportCategory.CLIENT } }),
      this.supportRepo.count({ where: { category: SupportCategory.VISITOR } }),
    ]);

    return {
      total,
      answered,
      unanswered,
      seen,
      unseen,
      clientTickets,
      visitorTickets,
      responseRate:
        total > 0
          ? Number.parseFloat(((answered / total) * 100).toFixed(2))
          : 0,
    };
  }

  private async getRevenueAnalytics() {
    const [totalRevenue, productRevenue, bookRevenue, paidOrdersRevenue] =
      await Promise.all([
        this.orderRepo
          .createQueryBuilder('order')
          .leftJoin('order.product', 'product')
          .select('SUM(product.price)', 'total')
          .getRawOne(),
        this.orderRepo
          .createQueryBuilder('order')
          .leftJoin('order.product', 'product')
          .where('product.type = :type', { type: ProductTypeEnum.PRODUCT })
          .select('SUM(product.price)', 'total')
          .getRawOne(),
        this.orderRepo
          .createQueryBuilder('order')
          .leftJoin('order.product', 'product')
          .where('product.type = :type', { type: ProductTypeEnum.BOOK })
          .select('SUM(product.price)', 'total')
          .getRawOne(),
        this.orderRepo
          .createQueryBuilder('order')
          .leftJoin('order.product', 'product')
          .where('order.isPaid = :isPaid', { isPaid: true })
          .select('SUM(product.price)', 'total')
          .getRawOne(),
      ]);

    return {
      totalRevenue: Number.parseFloat(totalRevenue?.total || '0'),
      productRevenue: Number.parseFloat(productRevenue?.total || '0'),
      bookRevenue: Number.parseFloat(bookRevenue?.total || '0'),
      paidOrdersRevenue: Number.parseFloat(paidOrdersRevenue?.total || '0'),
      pendingRevenue:
        Number.parseFloat(totalRevenue?.total || '0') -
        Number.parseFloat(paidOrdersRevenue?.total || '0'),
    };
  }

  private async getRecentActivityAnalytics() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [
      newPropertiesLast30Days,
      newPropertiesLast7Days,
      newOrdersLast30Days,
      newOrdersLast7Days,
      newSupportTicketsLast30Days,
      newSupportTicketsLast7Days,
      newPropertyRequestsLast30Days,
      newPropertyRequestsLast7Days,
    ] = await Promise.all([
      this.propertyRepo
        .createQueryBuilder('property')
        .where('property.createdAt >= :date', { date: thirtyDaysAgo })
        .getCount(),
      this.propertyRepo
        .createQueryBuilder('property')
        .where('property.createdAt >= :date', { date: sevenDaysAgo })
        .getCount(),
      this.orderRepo
        .createQueryBuilder('order')
        .where('order.createdAt >= :date', { date: thirtyDaysAgo })
        .getCount(),
      this.orderRepo
        .createQueryBuilder('order')
        .where('order.createdAt >= :date', { date: sevenDaysAgo })
        .getCount(),
      this.supportRepo
        .createQueryBuilder('support')
        .where('support.createdAt >= :date', { date: thirtyDaysAgo })
        .getCount(),
      this.supportRepo
        .createQueryBuilder('support')
        .where('support.createdAt >= :date', { date: sevenDaysAgo })
        .getCount(),
      this.propertyRequestRepo
        .createQueryBuilder('request')
        .where('request.createdAt >= :date', { date: thirtyDaysAgo })
        .getCount(),
      this.propertyRequestRepo
        .createQueryBuilder('request')
        .where('request.createdAt >= :date', { date: sevenDaysAgo })
        .getCount(),
    ]);

    return {
      last30Days: {
        newProperties: newPropertiesLast30Days,
        newOrders: newOrdersLast30Days,
        newSupportTickets: newSupportTicketsLast30Days,
        newPropertyRequests: newPropertyRequestsLast30Days,
      },
      last7Days: {
        newProperties: newPropertiesLast7Days,
        newOrders: newOrdersLast7Days,
        newSupportTickets: newSupportTicketsLast7Days,
        newPropertyRequests: newPropertyRequestsLast7Days,
      },
    };
  }
}
