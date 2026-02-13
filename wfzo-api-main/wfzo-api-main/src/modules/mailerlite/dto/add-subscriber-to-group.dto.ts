import { IsEmail } from 'class-validator';

export class AddSubscriberToGroupDto {
  @IsEmail()
  email!: string;
}