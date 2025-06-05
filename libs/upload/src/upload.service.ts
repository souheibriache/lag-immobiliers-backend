import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import * as Minio from 'minio';
import { ConfigService } from '@app/config';
import * as crypto from 'crypto';
import {
  BucketNamesEnum,
  minioBucketPolicy,
} from '@app/common/utils/constants/buckets';

@Injectable()
export class UploadService {
  private minioClient: Minio.Client;
  private bucketName: string;

  constructor(private readonly configService: ConfigService) {
    this.minioClient = new Minio.Client({
      endPoint: this.configService.get('MINIO_ENDPOINT'),
      port: Number(this.configService.get('MINIO_PORT')),
      useSSL: this.configService.get('MINIO_USE_SSL') === 'true',
      accessKey: this.configService.get('MINIO_ACCESS_KEY'),
      secretKey: this.configService.get('MINIO_SECRET_KEY'),
    });
    this.bucketName = this.configService.get('MINIO_BUCKET_NAME');
    this.initializeMinio();
  }

  async initializeMinio() {
    const buckets = await this.minioClient.listBuckets();
    const minioBuckets = buckets.map((bucket) => bucket.name);
    const localBuckets = Object.values(BucketNamesEnum);
    const missingBuckets = localBuckets.filter(
      (bucket) => !minioBuckets.includes(bucket),
    );
    if (!missingBuckets.length) return;

    console.log({ missingBuckets, localBuckets, minioBuckets });
    for (const bucket of missingBuckets) {
      await this.minioClient
        .makeBucket(bucket, 'eu-west-1', {
          ObjectLocking: false,
        })
        .then(async () => {
          console.log('BUCKET CREATED');
          await this.minioClient.setBucketPolicy(
            bucket,
            JSON.stringify(minioBucketPolicy(bucket)),
          );
        })
        .catch((err) => console.error(err));
      Logger.log(`BUCKET ${bucket} INITIALIZED SUCCESSFULLY!`);
    }
  }

  async createBucketIfNotExists(bucketName: string) {
    try {
      const bucketExists = await this.minioClient.bucketExists(bucketName);
      if (!bucketExists) {
        await this.minioClient.makeBucket(bucketName, 'eu-west-1', {
          ObjectLocking: false,
        });
      }
    } catch (err) {
      console.error(err);
      throw err;
    }
  }

  async uploadFile(
    file: Express.Multer.File,
    bucketName: string = this.bucketName,
  ) {
    await this.createBucketIfNotExists(bucketName);
    let temp_filename = Date.now().toString();
    let hashedFileName = crypto
      .createHash('md5')
      .update(temp_filename)
      .digest('hex');
    let ext = file.originalname.substring(
      file.originalname.lastIndexOf('.'),
      file.originalname.length,
    );

    let filename = hashedFileName + ext;
    const fileName: string = `${filename}`;
    await this.minioClient.putObject(
      bucketName,
      fileName,
      file.buffer,
      file.size,
    );
    return {
      fullUrl: `https://${this.configService.get('MINIO_ENDPOINT')}/${bucketName}/${filename}`,
      originalName: file.originalname,
      placeHolder: filename,
      name: filename,
    };
  }

  async getFileUrl(fileName: string, bucketName: string = this.bucketName) {
    return await this.minioClient.presignedUrl('GET', bucketName, fileName);
  }

  async upload(file: Express.Multer.File, bucketName?: string) {
    return await this.uploadFile(file, bucketName);
  }

  async uploadMany(files: Express.Multer.File[], bucketName?: string) {
    const promises = [];
    for (const file of files) {
      promises.push(this.uploadFile(file, bucketName));
    }
    return await Promise.all(promises);
  }

  async deleteFile(fileName: string, bucketName: string = this.bucketName) {
    await this.minioClient.removeObject(bucketName, fileName);
  }
}
