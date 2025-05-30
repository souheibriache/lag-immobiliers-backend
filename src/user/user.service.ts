import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities';
import {
  FindOptionsOrder,
  FindOptionsRelations,
  FindOptionsSelect,
  FindOptionsWhere,
  Repository,
} from 'typeorm';
import { IUser } from './interfaces/user.interface';
import { CreateUserDto } from './dto/create-user.dto';
import { UserRoles } from './enums/user-roles.enum';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto) {
    try {
      console.log({ createUserDto });
      const user = this.userRepository.create({
        ...createUserDto,
        role: UserRoles.ADMIN,
        isSuperUser: true,
      });
      const created = await this.userRepository.save(user);
      return created;
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException('Internal server error!');
    }
  }

  async findAll(
    where?: FindOptionsWhere<User>,
    relations?: FindOptionsRelations<User>,
    order?: FindOptionsOrder<User>,
    select?: FindOptionsSelect<User>,
  ) {
    return await this.userRepository.find({ where, relations, order, select });
  }

  async findOne(findOptions: {
    where?: FindOptionsWhere<User> | FindOptionsWhere<User>[];
    relations?: FindOptionsRelations<User>;
    order?: FindOptionsOrder<User>;
    select?: FindOptionsSelect<User>;
  }): Promise<IUser> {
    const { where, relations, order, select } = findOptions;
    const user = await this.userRepository.findOne({
      where,
      relations,
      order,
      select,
    });
    if (!user) throw new NotFoundException('User not found');

    return user;
  }

  async getOneById(id: string): Promise<IUser> {
    return await this.findOne({ where: { id } });
  }
}
