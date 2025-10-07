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
  @ApiProperty({ description: '响应状态码', example: 0 })
  code: number;

  @ApiProperty({ description: '响应消息', example: 'success' })
  message: string;

  @ApiProperty({ description: '响应数据' })
  data: TData;
}

export class PaginatedDto<TData> {
  @ApiProperty({ description: '响应状态码', example: 0 })
  code: number;

  @ApiProperty({ description: '分页数据' })
  data: {
    records: TData[];
    total: number;
    page: number;
    page_size: number;
  };

  @ApiProperty({ description: '响应消息', example: 'success' })
  message: string;
}

export class ArrayDto<TData> {
  @ApiProperty({ description: '响应状态码', example: 0 })
  code: number;

  @ApiProperty({ description: '响应消息', example: 'success' })
  message: string;

  @ApiProperty({ description: '数组数据', type: 'array' })
  data: TData[];
}
