import { IsEnum, IsString, IsOptional, IsUUID, IsObject, IsBoolean, IsArray } from 'class-validator';

export enum ChannelType {
  EMAIL = 'EMAIL',
  WHATSAPP = 'WHATSAPP',
  SMS = 'SMS',
  CALL = 'CALL',
  NOTE = 'NOTE',
  MEETING = 'MEETING',
}

export enum DirectionType {
  INBOUND = 'INBOUND',
  OUTBOUND = 'OUTBOUND',
  INTERNAL = 'INTERNAL',
}

export class CreateInteractionDto {
  @IsUUID()
  @IsOptional()
  clientId?: string;

  @IsUUID()
  @IsOptional()
  contactId?: string;

  @IsUUID()
  @IsOptional()
  opportunityId?: string;

  @IsEnum(ChannelType)
  channel: ChannelType;

  @IsEnum(DirectionType)
  @IsOptional()
  direction?: DirectionType = DirectionType.OUTBOUND;

  @IsString()
  @IsOptional()
  subject?: string;

  @IsString()
  content: string;

  @IsString()
  fromAddress: string;

  @IsString()
  toAddress: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  ccAddresses?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  bccAddresses?: string[];

  @IsString()
  @IsOptional()
  provider?: string;

  @IsString()
  @IsOptional()
  externalId?: string;

  @IsString()
  @IsOptional()
  threadId?: string;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;

  @IsUUID()
  @IsOptional()
  parentId?: string;

  @IsBoolean()
  @IsOptional()
  isPrivate?: boolean = false;
}

export class SearchInteractionDto {
  @IsString()
  q: string;

  @IsUUID()
  @IsOptional()
  clientId?: string;
}

export class TimelineQueryDto {
  @IsString()
  @IsOptional()
  channels?: string;

  @IsString()
  @IsOptional()
  limit?: string = '50';

  @IsString()
  @IsOptional()
  offset?: string = '0';

  @IsString()
  @IsOptional()
  includePrivate?: string = 'false';
}
