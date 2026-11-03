import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ResponseFormat<T = any> {
  code: string;
  data?: T;
  message: string;
}

export const RESPONSE_MESSAGE_METADATA = 'response_message_metadata';
export const RESPONSE_CODE_METADATA = 'response_code_metadata';

export const ResponseMessage = (message: string) =>
  SetMetadata(RESPONSE_MESSAGE_METADATA, message);

export const ResponseCode = (code: string) =>
  SetMetadata(RESPONSE_CODE_METADATA, code);

function toSnakeCaseUpper(str: string): string {
  return str
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/Controller$/, '')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .toUpperCase()
    .replace(/^_+|_+$/g, '');
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<
  T,
  ResponseFormat<T>
> {
  constructor(private readonly reflector: Reflector = new Reflector()) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<ResponseFormat<T>> {
    const handler = context.getHandler();
    const targetClass = context.getClass();

    const customMessage = this.reflector.getAllAndOverride<string>(
      RESPONSE_MESSAGE_METADATA,
      [handler, targetClass],
    );

    const customCode = this.reflector.getAllAndOverride<string>(
      RESPONSE_CODE_METADATA,
      [handler, targetClass],
    );

    const defaultCode = this.getDefaultCode(context);

    return next.handle().pipe(
      map((res: any) => {
        let code = customCode ?? defaultCode;
        let message = customMessage ?? 'Success';
        let data: any = res;

        if (
          res &&
          typeof res === 'object' &&
          !Array.isArray(res) &&
          ('code' in res || 'message' in res)
        ) {
          if (typeof res.code === 'string') {
            code = res.code;
          }
          if (typeof res.message === 'string') {
            message = res.message;
          }
          if ('data' in res) {
            data = res.data;
          } else {
            const { code: _, message: __, ...rest } = res;
            data = Object.keys(rest).length > 0 ? rest : undefined;
          }
        }

        const formatted: ResponseFormat<T> = {
          code,
          ...(data !== undefined && data !== null ? { data } : {}),
          message,
        };

        return formatted;
      }),
    );
  }

  private getDefaultCode(context: ExecutionContext): string {
    const className = context.getClass()?.name || 'APP';
    const handlerName = context.getHandler()?.name || 'ACTION';
    const classPrefix = toSnakeCaseUpper(className);
    const handlerSuffix = toSnakeCaseUpper(handlerName);
    return `${classPrefix}_${handlerSuffix}_SUCCESS`;
  }
}
