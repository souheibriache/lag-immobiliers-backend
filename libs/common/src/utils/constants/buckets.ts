export enum BucketNamesEnum {
  accompaniement = 'accompaniement',
  products = 'products',
  properties = 'properties',
  support = 'support',
  testing = 'testing',
}

export const minioBucketPolicy = (bucketName: string) => ({
  Version: '2012-10-17',
  Statement: [
    {
      Sid: 'PublicReadGetObject',
      Effect: 'Allow',
      Principal: { AWS: ['*'] },
      Action: ['s3:GetObject'],
      Resource: [`arn:aws:s3:::${bucketName}/*`],
    },
  ],
});
