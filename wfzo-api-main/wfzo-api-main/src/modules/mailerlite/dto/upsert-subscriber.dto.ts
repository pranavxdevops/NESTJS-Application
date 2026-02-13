import { IsEmail, IsOptional, IsObject, IsArray, IsString } from 'class-validator';

export class UpsertSubscriberDto {
  @IsEmail()
  email!: string;

  @IsOptional()
  @IsObject()
  fields?: Record<string, any>;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  groups?: string[];
}