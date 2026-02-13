import { IsEmail, IsNotEmpty, IsString, MinLength } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

/**
 * Login Request DTO
 */
export class LoginDto {
  @ApiProperty({
    example: "john.doe@example.com",
    description: "User email (also username)",
  })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({
    example: "SecureP@ssw0rd123",
    description: "User password",
    minLength: 8,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password!: string;
}

/**
 * Login Response DTO
 */
export class LoginResponseDto {
  @ApiProperty({
    example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    description: "JWT access token (15 minutes expiry)",
  })
  accessToken!: string;

  @ApiProperty({
    example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    description: "JWT refresh token (7 days expiry)",
  })
  refreshToken!: string;

  @ApiProperty({
    example: 900,
    description: "Access token expiry in seconds",
  })
  expiresIn!: number;

  @ApiProperty({
    example: "Bearer",
    description: "Token type",
  })
  tokenType!: string;

  @ApiProperty({
    example: {
      email: "john.doe@example.com",
      firstName: "John",
      lastName: "Doe",
      userType: "Primary",
    },
    description: "User information",
  })
  user!: {
    email: string;
    firstName?: string;
    lastName?: string;
    userType?: string;
  };
}

/**
 * Refresh Token Request DTO
 */
export class RefreshTokenDto {
  @ApiProperty({
    example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    description: "Refresh token from login response",
  })
  @IsString()
  @IsNotEmpty()
  refreshToken!: string;
}

/**
 * Refresh Token Response DTO
 */
export class RefreshTokenResponseDto {
  @ApiProperty({
    example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    description: "New JWT access token",
  })
  accessToken!: string;

  @ApiProperty({
    example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    description: "New JWT refresh token (rotated)",
  })
  refreshToken!: string;

  @ApiProperty({
    example: 900,
    description: "Access token expiry in seconds",
  })
  expiresIn!: number;

  @ApiProperty({
    example: "Bearer",
    description: "Token type",
  })
  tokenType!: string;
}
