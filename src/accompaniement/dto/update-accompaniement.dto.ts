import { PartialType } from '@nestjs/swagger';
import { CreateAccompaniementDto } from './create-accompaniement.dto';

export class UpdateAccompaniementDto extends PartialType(
  CreateAccompaniementDto,
) {}
