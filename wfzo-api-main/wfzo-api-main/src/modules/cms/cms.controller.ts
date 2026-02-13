import { Controller, Get, Param } from "@nestjs/common";
import { CmsService, type CmsResponse } from "./cms.service";

@Controller("cms")
export class CmsController {
  constructor(private readonly cms: CmsService) {}

  @Get(":page")
  getContentByPage(@Param("page") page: string): CmsResponse {
    return this.cms.getContentByPage(page);
  }
}
