import { IsBoolean, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class VerifyBackupCodeDto {
  @IsNotEmpty()
  @IsString()
  code!: string;
}

export class UpdateSecuritySettingDto {
  @IsOptional()
  @IsString()
  recoveryEmail?: string;

  @IsOptional()
  @IsString()
  recoveryPhone?: string;

  @IsOptional()
  @IsBoolean()
  loginAlerts?: boolean;
}
