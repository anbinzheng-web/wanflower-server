import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { ApiResponse } from 'shared/dto/response.dto';
import { Observable, map } from 'rxjs';
import Negotiator from 'negotiator';
import { langMap, t } from 'shared/locales';

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponse<T>> {
    const request = context.switchToHttp().getRequest();
    const negotiator = new Negotiator(request);
    const lang = negotiator.language(Object.keys(langMap)) || 'en';
    return next.handle().pipe(
      map((data) => {
        if (data?.code !== undefined) {
          return data;
        }

        return ApiResponse.success(data, t('success', lang));
      }),
    );
  }
}
