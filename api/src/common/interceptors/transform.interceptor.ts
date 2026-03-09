import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
  success: boolean;
  data: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, Response<T>> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Response<T>> {
    return next.handle().pipe(
      map((data) => {
        // Si la respuesta ya tiene el formato correcto, devolverla tal cual
        if (data && typeof data === 'object' && 'success' in data) {
          return data;
        }

        // Si hay paginación en la respuesta
        if (data && typeof data === 'object' && 'pagination' in data) {
          const { pagination, ...restData } = data;
          return {
            success: true,
            data: restData,
            meta: pagination,
          };
        }

        return {
          success: true,
          data,
        };
      }),
    );
  }
}
