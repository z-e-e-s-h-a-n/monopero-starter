import { OtpPurpose, OtpType } from "@prisma/client";
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from "class-validator";

export class SignInDto {
  @IsString()
  @IsNotEmpty()
  identifier!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password!: string;
}

export class SignUpDto extends SignInDto {
  @IsOptional()
  @IsString()
  username?: string;

  @IsString()
  @IsNotEmpty()
  firstName!: string;

  @IsOptional()
  @IsString()
  lastName?: string;
}

export class RequestOtpDto {
  @IsString()
  @IsNotEmpty()
  identifier!: string;

  @IsEnum(OtpPurpose)
  purpose!: OtpPurpose;
}

export class ValidateOtpDto extends RequestOtpDto {
  @IsString()
  @IsNotEmpty()
  secret!: string;

  @IsOptional()
  @IsEnum(OtpType)
  type?: OtpType;
}

export class ResetPasswordDto extends ValidateOtpDto {
  @IsString()
  @IsNotEmpty()
  newPassword!: string;
}

export class ChangeIdentifierDto extends ValidateOtpDto {
  @IsString()
  @IsNotEmpty()
  newIdentifier!: string;
}
