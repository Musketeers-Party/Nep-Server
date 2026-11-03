import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { of } from 'rxjs';
import { describe, expect, it } from 'vitest';
import {
  RESPONSE_CODE_METADATA,
  RESPONSE_MESSAGE_METADATA,
  ResponseInterceptor,
} from './response.interceptor.js';

describe('ResponseInterceptor', () => {
  const createMockContext = (options?: {
    className?: string;
    handlerName?: string;
    customCode?: string;
    customMessage?: string;
  }): { context: ExecutionContext; reflector: Reflector } => {
    function sampleHandler() {}

    class SampleController {}

    const reflector = {
      getAllAndOverride: (key: string) => {
        if (key === RESPONSE_CODE_METADATA) return options?.customCode;
        if (key === RESPONSE_MESSAGE_METADATA) return options?.customMessage;
        return undefined;
      },
    } as unknown as Reflector;

    const context = {
      getClass: () =>
        options?.className ? { name: options.className } : SampleController,
      getHandler: () =>
        options?.handlerName ? { name: options.handlerName } : sampleHandler,
    } as unknown as ExecutionContext;

    return { context, reflector };
  };

  it('formats response with default code and message when data is returned', async () => {
    const { context, reflector } = createMockContext({
      className: 'ExampleObjController',
      handlerName: 'blabla',
    });
    const interceptor = new ResponseInterceptor(reflector);

    const callHandler = {
      handle: () => of(['item1', 'item2']),
    };

    const observable = interceptor.intercept(context, callHandler as any);
    const result = await new Promise((resolve) =>
      observable.subscribe(resolve),
    );

    expect(result).toEqual({
      code: 'EXAMPLE_OBJ_BLABLA_SUCCESS',
      data: ['item1', 'item2'],
      message: 'Success',
    });
  });

  it('omits data when handler returns undefined or null', async () => {
    const { context, reflector } = createMockContext({
      className: 'HealthController',
      handlerName: 'check',
    });
    const interceptor = new ResponseInterceptor(reflector);

    const callHandler = {
      handle: () => of(undefined),
    };

    const observable = interceptor.intercept(context, callHandler as any);
    const result = await new Promise<any>((resolve) =>
      observable.subscribe(resolve),
    );

    expect(result).toEqual({
      code: 'HEALTH_CHECK_SUCCESS',
      message: 'Success',
    });
    expect(result.data).toBeUndefined();
  });

  it('respects custom code and message metadata', async () => {
    const { context, reflector } = createMockContext({
      customCode: 'EXAMPLE_OBJ_blabla',
      customMessage: 'blabal',
    });
    const interceptor = new ResponseInterceptor(reflector);

    const callHandler = {
      handle: () => of([]),
    };

    const observable = interceptor.intercept(context, callHandler as any);
    const result = await new Promise((resolve) =>
      observable.subscribe(resolve),
    );

    expect(result).toEqual({
      code: 'EXAMPLE_OBJ_blabla',
      data: [],
      message: 'blabal',
    });
  });

  it('handles custom code/message inside returned object without double wrapping', async () => {
    const { context, reflector } = createMockContext();
    const interceptor = new ResponseInterceptor(reflector);

    const callHandler = {
      handle: () =>
        of({
          code: 'CUSTOM_RETURNED_CODE',
          message: 'Operation completed',
          data: { id: 1 },
        }),
    };

    const observable = interceptor.intercept(context, callHandler as any);
    const result = await new Promise((resolve) =>
      observable.subscribe(resolve),
    );

    expect(result).toEqual({
      code: 'CUSTOM_RETURNED_CODE',
      data: { id: 1 },
      message: 'Operation completed',
    });
  });
});
