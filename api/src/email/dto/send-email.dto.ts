import { IsEmail, IsString, IsOptional, IsUUID, IsObject, IsBoolean } from 'class-validator';

export class SendEmailDto {
  @IsEmail()
  to: string;

  @IsString()
  subject: string;

  @IsString()
  body: string;

  @IsUUID()
  @IsOptional()
  contactId?: string;

  @IsString()
  @IsOptional()
  fromName?: string;

  @IsEmail()
  @IsOptional()
  fromEmail?: string;
}

export class ConfigureEmailDto {
  @IsString()
  smtpHost: string;

  @IsString()
  smtpPort: string;

  @IsBoolean()
  @IsOptional()
  smtpSecure?: boolean = true;

  @IsString()
  smtpUser: string;

  @IsString()
  smtpPassword: string;

  @IsEmail()
  fromEmail: string;

  @IsString()
  @IsOptional()
  fromName?: string;
}

export class EmailWebhookDto {
  @IsString()
  event: string;

  @IsEmail()
  email: string;

  @IsString()
  @IsOptional()
  messageId?: string;

  @IsObject()
  @IsOptional()
  data?: Record<string, any>;
}
