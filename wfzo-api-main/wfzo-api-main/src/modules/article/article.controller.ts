import {
  Body,
  Controller,
  HttpCode,
  Post,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from "@nestjs/swagger";
import { ArticleService } from "./article.service";
import { ApiKeyGuard } from "../auth/guards/api-key.guard";
import {
  SendArticleEmailRequest,
  SendArticleEmailResponse,
} from "./dto/article.dto";

@ApiTags("Articles")
@Controller("article")
export class ArticleController {
  constructor(private readonly articleService: ArticleService) {}

  @Post("send-email")
  @UseGuards(ApiKeyGuard)
  @HttpCode(200)
  @ApiOperation({
    summary: "Send article notification email",
    description: "Send a templated email for article notifications (approval, rejection, submission)",
  })
  @ApiBody({ type: SendArticleEmailRequest })
  @ApiResponse({
    status: 200,
    description: "Email sent successfully",
    type: SendArticleEmailResponse,
  })
  @ApiResponse({ status: 400, description: "Bad request - validation error" })
  async sendArticleEmail(@Body() dto: SendArticleEmailRequest): Promise<SendArticleEmailResponse> {
    return this.articleService.sendArticleEmail(dto);
  }
}