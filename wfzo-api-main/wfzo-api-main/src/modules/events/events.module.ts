import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { ConfigModule } from "../../shared/config/config.module";
import { EmailModule } from "../../shared/email/email.module";
import { EventsController } from "./events.controller";
import { EventsService } from "./events.service";
import { Event, EventSchema } from "./schemas/event.schema";
import { Registration, RegistrationSchema } from "./schemas/registration.schema";
import { EventRepository } from "./repository/event.repository";
import { RegistrationRepository } from "./repository/registration.repository";
import { ZoomStubService, ZoomRealService, ZoomServiceProvider, ZOOM_SERVICE } from "./zoom";

@Module({
  imports: [
    ConfigModule,
    EmailModule,
    MongooseModule.forFeature([
      { name: Event.name, schema: EventSchema },
      { name: Registration.name, schema: RegistrationSchema },
    ]),
  ],
  controllers: [EventsController],
  providers: [
    EventsService,
    EventRepository,
    RegistrationRepository,
    ZoomStubService,
    ZoomRealService,
    ZoomServiceProvider,
  ],
  exports: [EventsService, ZOOM_SERVICE],
})
export class EventsModule {}
