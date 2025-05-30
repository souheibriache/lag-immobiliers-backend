import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { NewsletterService } from './newsletter.service';
import { NewsletterEmailDto, NewsletterOptionsDto } from './dto';
import { PageDto } from '@app/pagination/dto';
import { INewsLetter } from './interfaces/newsletter.interface';
import { AccessTokenGuard } from 'src/auth/guards/access-token.guard';
import { SuperUserGuard } from 'src/auth/guards/super-user.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@Controller('newsletter')
@ApiTags('newsletter')
export class NewsletterController {
  constructor(private readonly NewsletterService: NewsletterService) {}

  @Post()
  async create(@Body() createNewsLetterDto: NewsletterEmailDto) {
    return await this.NewsletterService.create(createNewsLetterDto);
  }

  @Get()
  @UseGuards(AccessTokenGuard, SuperUserGuard)
  @ApiBearerAuth()
  async getPaginatedNewsletter(
    @Query() pageOptionsDto: NewsletterOptionsDto,
  ): Promise<PageDto<INewsLetter>> {
    return await this.NewsletterService.getPaginated(pageOptionsDto);
  }
}
