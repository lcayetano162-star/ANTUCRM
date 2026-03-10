import { ContactsService } from '../services/contacts.service';
import { ContactsAIService } from '../services/contacts-ai.service';
import { BulkImportService } from '../services/bulk-import.service';
import { UserRole } from '../../auth/types/auth.types';
import { ContactQueryDto } from '../dto/contact-query.dto';
import { CreateContactDto } from '../dto/create-contact.dto';
import { UpdateContactDto } from '../dto/update-contact.dto';
import { BulkActionDto } from '../dto/bulk-action.dto';
import { ContactsDashboard, ContactDetail, ContactCard, BulkActionResult, ContactAIInsight, ContactScoringResult, NextBestAction } from '../types/contacts.types';
export declare class ContactsController {
    private readonly contactsService;
    private readonly aiService;
    private readonly bulkImport;
    constructor(contactsService: ContactsService, aiService: ContactsAIService, bulkImport: BulkImportService);
    getDashboard(tenantId: string, userId: string, userRole: UserRole, params: ContactQueryDto): Promise<ContactsDashboard>;
    searchContacts(tenantId: string, userId: string, userRole: UserRole, query: string, limit?: string): Promise<ContactCard[]>;
    bulkActions(tenantId: string, userId: string, userRole: UserRole, data: BulkActionDto): Promise<BulkActionResult>;
    importContacts(tenantId: string, userId: string, rows: any[]): Promise<import("../services/bulk-import.service").ImportResult>;
    getContactById(tenantId: string, userId: string, userRole: UserRole, contactId: string): Promise<ContactDetail>;
    createContact(tenantId: string, userId: string, data: CreateContactDto): Promise<ContactCard>;
    updateContact(tenantId: string, userId: string, contactId: string, data: UpdateContactDto): Promise<ContactCard>;
    deleteContact(tenantId: string, userId: string, userRole: UserRole, contactId: string): Promise<void>;
    getContactInsights(tenantId: string, userId: string, userRole: UserRole, contactId: string): Promise<ContactAIInsight[]>;
    scoreContact(tenantId: string, userId: string, userRole: UserRole, contactId: string): Promise<ContactScoringResult>;
    getNextBestAction(tenantId: string, userId: string, userRole: UserRole, contactId: string): Promise<NextBestAction>;
}
