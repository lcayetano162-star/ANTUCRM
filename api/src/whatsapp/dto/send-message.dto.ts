import { IsString, IsOptional, IsUUID, IsObject } from 'class-validator';

export class SendMessageDto {
  @IsString()
  phoneNumber: string;

  @IsString()
  message: string;

  @IsUUID()
  @IsOptional()
  contactId?: string;

  @IsUUID()
  @IsOptional()
  clientId?: string;

  @IsUUID()
  @IsOptional()
  opportunityId?: string;

  @IsString()
  @IsOptional()
  templateName?: string;

  @IsObject()
  @IsOptional()
  templateParams?: Record<string, any>;
}

export class ConfigureWhatsAppDto {
  @IsString()
  phoneNumberId: string;

  @IsString()
  @IsOptional()
  businessAccountId?: string;

  @IsString()
  accessToken: string;

  @IsString()
  @IsOptional()
  appSecret?: string;

  @IsString()
  @IsOptional()
  webhookVerifyToken?: string;
}

export class WebhookPayloadDto {
  object: string;
  entry: Array<{
    id: string;
    changes: Array<{
      value: {
        messaging_product: string;
        metadata: {
          display_phone_number: string;
          phone_number_id: string;
        };
        contacts?: Array<{
          wa_id: string;
          profile: { name: string };
        }>;
        messages?: Array<{
          id: string;
          from: string;
          timestamp: string;
          type: string;
          text?: { body: string };
          image?: { id: string; caption?: string };
          document?: { id: string; filename: string };
          context?: { id: string };
        }>;
        statuses?: Array<{
          id: string;
          status: 'sent' | 'delivered' | 'read' | 'failed';
          timestamp: string;
          recipient_id: string;
          conversation?: {
            id: string;
            category: string;
            expiration_timestamp: string;
          };
          errors?: Array<{
            code: number;
            title: string;
            message: string;
          }>;
        }>;
      };
      field: string;
    }>;
  }>;
}
