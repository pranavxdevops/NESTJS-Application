import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from "class-validator";
import { EnquiryStatus } from "../schemas/enquiry.schema";

export class UpdateEnquiryDto {
  @IsNotEmpty()
  @IsEnum(EnquiryStatus)
  enquiryStatus!: EnquiryStatus;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  comments?: string;
}
