import { applyDecorators } from '@nestjs/common';
import { ApiExtraModels, ApiOkResponse, getSchemaPath } from '@nestjs/swagger';
import { PaginatedDto, MessageDto, ArrayDto } from 'shared/dto/response.dto';

// 定义类型约束，避免使用 Type<any>
type Constructor = new (...args: any[]) => any;

export const ApiPaginatedResponse = <TModel extends Constructor>(
  model: TModel
) => {
  return applyDecorators(
    ApiExtraModels(PaginatedDto, model),
    ApiOkResponse({
      schema: {
        allOf: [
          { $ref: getSchemaPath(PaginatedDto) },
          {
            properties: {
              code: { type: 'number', example: 0 },
              message: { type: 'string', example: '请求成功' },
              data: {
                type: 'object',
                properties: {
                  records: {
                    type: 'array',
                    items: { $ref: getSchemaPath(model) },
                  },
                  total: { type: 'number' },
                  page: { type: 'number' },
                  page_size: { type: 'number' },
                },
              },
            },
          },
        ],
      },
    }),
  );
};

export const ApiMessageResponse = <TModel extends Constructor>(
  model?: TModel,
) => {
  // 创建一个默认的空类，用于没有指定模型的情况
  const DefaultModel = class {};
  
  return applyDecorators(
    ApiExtraModels(MessageDto, model || DefaultModel),
    ApiOkResponse({
      schema: {
        allOf: [
          { $ref: getSchemaPath(MessageDto) },
        ],
        properties: {
          data: model ? {
            $ref: getSchemaPath(model),
          } : {
            type: 'object',
            properties: {},
          },
        },
      },
    }),
  );
};

export const ApiArrayResponse = <TModel extends Constructor>(
  model: TModel
) => {
  return applyDecorators(
    ApiExtraModels(ArrayDto, model),
    ApiOkResponse({
      schema: {
        allOf: [
          { $ref: getSchemaPath(ArrayDto) },
          {
            properties: {
              code: { type: 'number', example: 0 },
              message: { type: 'string', example: '请求成功' },
              data: {
                type: 'array',
                items: { $ref: getSchemaPath(model) },
              },
            },
          },
        ],
      },
    }),
  );
};