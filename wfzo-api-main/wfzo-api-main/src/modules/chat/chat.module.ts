import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { Message, MessageSchema } from './schemas/message.schema';
import { ConversationPreferences, ConversationPreferencesSchema } from './schemas/conversation-preferences.schema';
import { Member, MemberSchema } from '../member/schemas/member.schema';
import { Connection, ConnectionSchema } from '../connection/schemas/connection.schema';
import { DocumentModule } from '../document/document.module';
import { EmailModule } from '../../shared/email/email.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Message.name, schema: MessageSchema },
      { name: ConversationPreferences.name, schema: ConversationPreferencesSchema },
      { name: Member.name, schema: MemberSchema },
      { name: Connection.name, schema: ConnectionSchema },
    ]),
    DocumentModule,
    EmailModule,
  ],
  controllers: [ChatController],
  providers: [ChatService],
  exports: [ChatService],
})
export class ChatModule {}
