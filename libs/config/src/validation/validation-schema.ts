import * as Joi from 'joi';

const APP_VALIDATION = {
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(3000),
  JWT_AUTH_KEY: Joi.string().required(),
  RESET_PASSWORD_SECRET_KEY: Joi.string().required(),
};

const SWAGGER_VALIDATION = {
  SWAGGER_ENDPOINT: Joi.string().default('doc'),
  SWAGGER_USERNAME: Joi.string().default('dev'),
  SWAGGER_PASSWORD: Joi.string().default('dev'),
};

const POSTGRES_VALIDATION = {
  DB_HOST: Joi.when('NODE_ENV', {
    is: Joi.valid('production', 'test'),
    then: Joi.string().required(),
    otherwise: Joi.forbidden(),
  }),
  DB_PORT: Joi.when('NODE_ENV', {
    is: Joi.valid('production', 'test'),
    then: Joi.number().required(),
    otherwise: Joi.forbidden(),
  }),
  DB_USER: Joi.when('NODE_ENV', {
    is: Joi.valid('production', 'test'),
    then: Joi.string().required(),
    otherwise: Joi.forbidden(),
  }),
  DB_PASSWORD: Joi.when('NODE_ENV', {
    is: Joi.valid('production', 'test'),
    then: Joi.string().allow(''),
    otherwise: Joi.forbidden(),
  }),
  DB_NAME: Joi.when('NODE_ENV', {
    is: Joi.valid('production', 'test'),
    then: Joi.string().required(),
    otherwise: Joi.forbidden(),
  }),
};

const DEV_POSTGRES_VALIDATION = {
  DEV_DB_HOST: Joi.when('NODE_ENV', {
    is: 'development',
    then: Joi.string().required(),
    otherwise: Joi.forbidden(),
  }),
  DEV_DB_PORT: Joi.when('NODE_ENV', {
    is: 'development',
    then: Joi.number().required(),
    otherwise: Joi.forbidden(),
  }),
  DEV_DB_USER: Joi.when('NODE_ENV', {
    is: 'development',
    then: Joi.string().required(),
    otherwise: Joi.forbidden(),
  }),
  DEV_DB_PASSWORD: Joi.when('NODE_ENV', {
    is: 'development',
    then: Joi.string().allow(''),
    otherwise: Joi.forbidden(),
  }),
  DEV_DB_NAME: Joi.when('NODE_ENV', {
    is: 'development',
    then: Joi.string().required(),
    otherwise: Joi.forbidden(),
  }),
};

const DASHBOARD_HOST_VALIDATION = {
  ADMIN_DASHBOARD_HOST: Joi.string().default(
    'https://admin.lag-immpbiliers.com',
  ),
  FRONTEND_HOST: Joi.string().default('https://lag-immpbiliers.com'),
};

const REDIS_VALIDATION = {
  REDIS_HOST: Joi.string().default('localhost'),
  REDIS_PORT: Joi.number().default(6379),
  REDIS_PASSWORD: Joi.string().default(''),
};

export const validationSchema = Joi.object({
  ...APP_VALIDATION,
  ...SWAGGER_VALIDATION,
  ...DASHBOARD_HOST_VALIDATION,
  ...POSTGRES_VALIDATION,
  ...DEV_POSTGRES_VALIDATION,
  ...REDIS_VALIDATION,
});
