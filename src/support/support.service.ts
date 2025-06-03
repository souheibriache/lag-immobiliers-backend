import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Support } from './entities';
import {
  FindOptionsOrder,
  FindOptionsRelations,
  FindOptionsWhere,
  ILike,
  In,
  IsNull,
  Not,
  Repository,
} from 'typeorm';
import {
  AnswerSupportQuestionDto,
  PostQuestionVisitorDto,
  SupportOptionsDto,
} from './dto';
import { ISupport } from './interfaces/support.interface';
import { CreateSupportQuestionDto } from './dto/create-support-question.dto';
import { SupportCategory } from './enums/support-category.enum';
import { MediaService } from '@app/media';
import { MailerService } from '@app/mailer';
import { UploadService } from '@app/upload';
import { ResourceTypeEnum } from '@app/media/enums/resource-type.enum';
import { User } from 'src/user/entities';
import { PageDto, PageMetaDto } from '@app/pagination/dto';
import * as archiver from 'archiver';
import axios from 'axios';
import { Readable } from 'stream';

@Injectable()
export class SupportService {
  constructor(
    @InjectRepository(Support)
    private readonly supportRepository: Repository<Support>,
    private readonly mediaService: MediaService,
    private readonly mailerService: MailerService,
    private readonly uploadService: UploadService,
  ) {}

  async create(createSupportInput: CreateSupportQuestionDto) {
    const {
      questionAttachments: questionAttachmentsFiles,
      ...restCreateSupportInput
    } = createSupportInput;
    const support = this.supportRepository.create(restCreateSupportInput);
    const savedSupport = await this.supportRepository.save(support);
    const bucketName = `support`;
    let questionAttachments;
    if (questionAttachmentsFiles)
      questionAttachments = await Promise.all(
        questionAttachmentsFiles.map(async (attachment) => {
          const fileUploaded = await this.uploadService.upload(
            attachment,
            bucketName,
          );
          console.log({ fileUploaded });
          if (!fileUploaded) throw new InternalServerErrorException();
          //TODO: fix upload files
          const media = {
            fullUrl: fileUploaded.fullUrl,
            name: fileUploaded.name,
            originalName: fileUploaded.originalName,
            placeHolder: fileUploaded.placeHolder,
            resourceType: ResourceTypeEnum.AUTO,
          };
          return await this.mediaService.create(media);
        }),
      );

    savedSupport.questionAttachments = questionAttachments;
    await this.supportRepository.save(savedSupport);

    await this.sendConfirmationEmail(savedSupport);

    return savedSupport;
  }

  async find(
    where?: FindOptionsWhere<Support>,
    relations?: FindOptionsRelations<Support>,
    order?: FindOptionsOrder<Support>,
  ) {
    return await this.supportRepository.find({ where, relations, order });
  }

  async findOne(
    where?: FindOptionsWhere<Support>,
    relations?: FindOptionsRelations<Support>,
    order?: FindOptionsOrder<Support>,
  ) {
    return await this.supportRepository.findOne({ where, relations, order });
  }

  async getSupportById(id: string): Promise<ISupport> {
    const relations: FindOptionsRelations<Support> = {
      answeredBy: true,
      attachments: true,
      questionAttachments: true,
    };
    const supportQuestion = await this.findOne({ id }, relations);

    if (!supportQuestion) throw new NotFoundException('Question not found!');

    if (!supportQuestion.seenAt) {
      await this.supportRepository.update(id, {
        seenAt: new Date(),
      });
    }
    return supportQuestion;
  }

  async postQuestion(postQuestionVisitorDto: PostQuestionVisitorDto) {
    return await this.create({
      ...postQuestionVisitorDto,
      category: SupportCategory.VISITOR,
    });
  }

  async answerSupportQuestion(
    id: string,
    answerSupportQuestionDto: AnswerSupportQuestionDto,
    answeredBy: User,
  ) {
    const supportQuestion = await this.getSupportById(id);
    if (supportQuestion.answeredAt)
      throw new BadRequestException('Question Already answered');
    const { attachments: attachmentFiles } = answerSupportQuestionDto;
    const filePath = `support/support_attachments/answers`;
    let attachments;
    if (attachmentFiles)
      attachments = await Promise.all(
        attachmentFiles.map(async (attachment) => {
          const fileUploaded = await this.uploadService.upload(
            attachment,
            filePath,
          );
          if (!fileUploaded) throw new InternalServerErrorException();
          const media = {
            fullUrl: fileUploaded.fullUrl,
            name: fileUploaded.name,
            originalName: fileUploaded.originalName,
            placeHolder: fileUploaded.placeHolder,
            resourceType: ResourceTypeEnum.AUTO,
          };
          return await this.mediaService.create(media);
        }),
      );

    supportQuestion.answeredBy = answeredBy;
    (supportQuestion.answeredAt = new Date()),
      (supportQuestion.adminAnswer = answerSupportQuestionDto.adminAnswer);
    supportQuestion.attachments = attachments;

    await supportQuestion.save();

    const answeredSupportQuestion = await this.getSupportById(id);
    await this.sendAnswerEmail(answeredSupportQuestion, attachmentFiles);
    return answeredSupportQuestion;
  }

  async sendAnswerEmail(
    supportQuestion: Support,
    attachmentFiles: Express.Multer.File[],
  ) {
    const { email, firstName, lastName, question, adminAnswer } =
      supportQuestion;
    const attachments = attachmentFiles.map((file) => {
      return {
        filename: file.originalname,
        content: file.buffer.toString('base64'),
        type: 'application/pdf',
      };
    });
    // Send email to user

    const dynamicTemplateData = {
      firstName,
      lastName,
      question,
      adminAnswer,
      supportId: supportQuestion.id,
    };

    this.mailerService.sendSingle({
      to: email,
      subject: `Lag-immobiliers support - ${supportQuestion.id}`,
      dynamicTemplateData,
      attachments,
      templateId: 'd-9266d956db9543a2a2c4f2c64a48b325',
    });
  }

  async sendConfirmationEmail(supportQuestion: Support) {
    const { email, firstName, lastName, question } = supportQuestion;

    const dynamicTemplateData = {
      firstName,
      lastName,
      supportId: supportQuestion.id,
    };

    this.mailerService.sendSingle({
      to: email,
      subject: `Lag-immobiliers support - ${supportQuestion.id}`,
      dynamicTemplateData,
      templateId: 'd-afc29d8a685e462ea83ce9789f2fd6ce',
    });
  }

  private async querySupports(
    where: FindOptionsWhere<Support>,
    supportOptionsDto: SupportOptionsDto,
  ): Promise<PageDto<ISupport>> {
    const {
      sort,
      skip,
      take,
      answeredById,
      email,
      name,
      subjects,
      category,
      isAnswered,
      isSeen,
    } = supportOptionsDto;

    const relations: FindOptionsRelations<Support> = {
      answeredBy: true,
      attachments: true,
      questionAttachments: true,
    };
    //Todo complete those after having the requirement

    if (answeredById)
      where.answeredBy = {
        id: answeredById,
      };
    if (email) where.email = ILike(`%${email}%`);
    if (name) where.firstName = ILike(`%${name}%`);
    if (subjects) where.subject = In(subjects);
    if (category) where.category = In(category);
    if (isSeen === true || isSeen === false)
      where.seenAt = isSeen ? Not(IsNull()) : IsNull();
    if (isAnswered === true || isAnswered === false)
      where.answeredAt = isAnswered ? Not(IsNull()) : IsNull();

    const [items, itemCount] = await this.supportRepository.findAndCount({
      where,
      skip,
      take,
      relations,
      order: sort,
    });

    const pageMetaDto = new PageMetaDto({
      itemCount,
      pageOptionsDto: supportOptionsDto,
    });
    return new PageDto(items, pageMetaDto);
  }

  async getAllSupports(supportOptionsDto: SupportOptionsDto) {
    const where: FindOptionsWhere<Support> = {};

    return await this.querySupports(where, supportOptionsDto);
  }

  async downloadAllAttachments(
    supportId: string,
    attachmentType: 'question' | 'answer' | 'all' = 'all',
  ): Promise<{ stream: Readable; fileName: string }> {
    const support = await this.supportRepository.findOne({
      where: { id: supportId },
      relations: ['attachments', 'questionAttachments'],
    });
    if (!support) {
      throw new NotFoundException('Support not found');
    }

    let allAttachments = [];

    if (['question', 'all'].includes(attachmentType)) {
      allAttachments = [
        ...allAttachments,
        ...(support.questionAttachments || []),
      ];
    }

    if (['answer', 'all'].includes(attachmentType)) {
      allAttachments = [...allAttachments, ...(support.attachments || [])];
    }

    if (allAttachments.length === 0) {
      throw new NotFoundException('No attachments found');
    }

    // Create a zip archive
    const archive = archiver('zip', { zlib: { level: 9 } });
    for (const attachment of allAttachments) {
      try {
        const response = await axios.get(attachment.fullUrl, {
          responseType: 'stream',
        });
        archive.append(response.data, { name: attachment.name });
      } catch (error) {
        console.error(
          `Failed to append file ${attachment.name}:`,
          error.message,
        );
      }
    }
    archive.finalize();

    const fileName = `support_${attachmentType}_attachments_${supportId}.zip`;
    return { stream: archive, fileName };
  }
}
