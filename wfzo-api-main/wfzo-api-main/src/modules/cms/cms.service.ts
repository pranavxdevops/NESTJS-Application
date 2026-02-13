import { Injectable } from "@nestjs/common";

export type CmsResponse = {
  page: string;
  locale?: string;
  data: Record<string, unknown>;
};

@Injectable()
export class CmsService {
  getContentByPage(page: string): CmsResponse {
    return { page, locale: "en", data: {} };
  }
}
