import { ApiProperty } from '@nestjs/swagger';

export class PaginatedData<T> {
  records: T[];

  total: number;

  page: number;

  page_size: number;

  constructor(records: T[], total: number, page: number, page_size: number) {
    this.records = records;
    this.total = total;
    this.page = page;
    this.page_size = page_size;
  }
}

export class ApiResponse<T = any> {
  code: number;

  data: T | null;

  message: string;

  constructor(data: T | null, message: string, code: number = 0) {
    this.data = data;
    this.message = message;
    this.code = code;
  }

  static success<T>(data: T, message: string = 'success') {
    return new ApiResponse<T>(data, message, 0);
  }

  static error<T>(message: string, code: number = 5000, data: T | null = null) {
    return new ApiResponse<T>(data, message, code);
  }

  toString() {
    return JSON.stringify({
      code: this.code,
      data: this.data,
      message: this.message,
    });
  }
}

export class MessageDto<TData> {
  @ApiProperty()
  code: number;

  @ApiProperty()
  message: string;

  data: TData;
}

export class PaginatedDto<TData> {
  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  page_size: number;

  records: TData[];
}

// 基础响应 DTO - 使用泛型
export class SwaggerApiResponse<T = any> {
  @ApiProperty({ description: '响应状态码', example: 0 })
  code: number;

  @ApiProperty({ description: '响应数据' })
  data: T;

  @ApiProperty({ description: '响应消息', example: 'success' })
  message: string;
}

// 分页数据响应 DTO - 使用泛型
export class SwaggerPaginatedResponse<T = any> {
  @ApiProperty({ description: '响应状态码', example: 0 })
  code: number;

  @ApiProperty({ description: '分页数据' })
  data: {
    records: T[];
    total: number;
    page: number;
    page_size: number;
  };

  @ApiProperty({ description: '响应消息', example: 'success' })
  message: string;
}

// 消息响应 DTO - 使用泛型
export class SwaggerMessageResponse<T = any> {
  @ApiProperty({ description: '响应状态码', example: 0 })
  code: number;

  @ApiProperty({ description: '响应数据' })
  data: T;

  @ApiProperty({ description: '响应消息', example: 'success' })
  message: string;
}
