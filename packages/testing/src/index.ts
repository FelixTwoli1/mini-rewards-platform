export * from '@nestjs/testing';

import { INestApplication } from '@nestjs/common';
import request from 'supertest';

export class TestHelper {
  static createBearerToken(token: string): string {
    return `Bearer ${token}`;
  }

  static async makeRequest(
    app: INestApplication,
    method: 'get' | 'post' | 'patch' | 'delete' | 'put',
    path: string,
    options?: {
      body?: Record<string, unknown>;
      token?: string;
      headers?: Record<string, string>;
    }
  ): Promise<request.Test> {
    const req = request(app.getHttpServer())[method](path);

    if (options?.token) {
      req.set('Authorization', this.createBearerToken(options.token));
    }

    if (options?.headers) {
      Object.entries(options.headers).forEach(([key, value]) => {
        req.set(key, value);
      });
    }

    if (options?.body) {
      req.send(options.body);
    }

    return req;
  }
}

export default TestHelper;
