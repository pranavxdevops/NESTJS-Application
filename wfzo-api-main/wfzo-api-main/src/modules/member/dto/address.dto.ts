import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNumber, IsOptional, IsString } from "class-validator";

export class AddressDto {
  @ApiProperty({ example: "123 Main St" })
  @IsString()
  line1!: string;

  @ApiPropertyOptional({ example: "Suite 400" })
  @IsOptional()
  @IsString()
  line2?: string;

  @ApiProperty({ example: "Metropolis" })
  @IsString()
  city!: string;

  @ApiProperty({ example: "NY" })
  @IsString()
  state!: string;

  @ApiProperty({ example: "USA" })
  @IsString()
  country!: string;

  @ApiPropertyOptional({ example: "US" })
  @IsString()
  @IsOptional()
  countryCode?: string;

  @ApiPropertyOptional({ example: "12345" })
  @IsString()
  @IsOptional()
  zip?: string;

  @ApiPropertyOptional({ example: 40.7128 })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({ example: -74.006 })
  @IsOptional()
  @IsNumber()
  longitude?: number;
}
