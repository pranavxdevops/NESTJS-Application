import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsString } from "class-validator";

export class InternalLoginRequestDto {
  @ApiProperty()
  @IsEmail()
  email!: string;

  @ApiProperty()
  @IsString()
  password!: string;
}

export class InternalLoginResponseDto {
  @ApiProperty()
  token!: string;

  @ApiProperty()
  expiresAt!: string;
}
