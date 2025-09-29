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
