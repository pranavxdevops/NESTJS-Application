import { Controller, Post, Get, Delete, Body, Param, NotFoundException, UseGuards } from '@nestjs/common';
import { MailerLiteService } from './mailerlite.service';
import { ApiKeyGuard } from '../auth/guards/api-key.guard';
import { UpsertSubscriberDto } from './dto/upsert-subscriber.dto';
import { CreateGroupDto } from './dto/create-group.dto';
import { AddSubscriberToGroupDto } from './dto/add-subscriber-to-group.dto';

@Controller('mailerlite')
export class MailerLiteController {
  constructor(private readonly mailerLiteService: MailerLiteService) {}

  // Subscriber endpoints
  @Post('subscribers')
  @UseGuards(ApiKeyGuard)
  async upsertSubscriber(@Body() dto: UpsertSubscriberDto) {
    return this.mailerLiteService.upsertSubscriber(dto.email, dto.fields, dto.groups);
  }

  @Get('subscribers/:email')
  @UseGuards(ApiKeyGuard)
  async getSubscriber(@Param('email') email: string) {
    const subscriber = await this.mailerLiteService.getSubscriber(email);
    if (!subscriber) {
      throw new NotFoundException(`Subscriber with email ${email} not found`);
    }
    return subscriber;
  }

  @Delete('subscribers/:email')
  @UseGuards(ApiKeyGuard)
  async deleteSubscriber(@Param('email') email: string) {
    return this.mailerLiteService.deleteSubscriber(email);
  }

  // Group endpoints
  @Get('groups')
  @UseGuards(ApiKeyGuard)
  async getGroups() {
    return this.mailerLiteService.getGroups();
  }

  @Post('groups')
  @UseGuards(ApiKeyGuard)
  async createGroup(@Body() dto: CreateGroupDto) {
    return this.mailerLiteService.createGroup(dto.name);
  }

  @Get('groups/:groupId/subscribers')
  @UseGuards(ApiKeyGuard)
  async getGroupSubscribers(@Param('groupId') groupId: string) {
    return this.mailerLiteService.getGroupSubscribers(groupId);
  }

  @Post('groups/:groupId/subscribers')
  @UseGuards(ApiKeyGuard)
  async addSubscriberToGroup(@Param('groupId') groupId: string, @Body() dto: AddSubscriberToGroupDto) {
    return this.mailerLiteService.addSubscriberToGroup(dto.email, groupId);
  }

  @Delete('groups/:groupId/subscribers/:email')
  async removeSubscriberFromGroup(@Param('groupId') groupId: string, @Param('email') email: string) {
    return this.mailerLiteService.removeSubscriberFromGroup(email, groupId);
  }
}