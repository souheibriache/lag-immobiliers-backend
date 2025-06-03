import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiResponse, ApiOperation } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { AnalyticsResponseDto } from './dto/analytics-response.dto';

@ApiTags('analytics')
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get()
  @ApiOperation({ summary: 'Get comprehensive analytics dashboard data' })
  @ApiResponse({ status: 200, type: AnalyticsResponseDto })
  async getAnalytics(): Promise<AnalyticsResponseDto> {
    return this.analyticsService.getComprehensiveAnalytics();
  }
}
