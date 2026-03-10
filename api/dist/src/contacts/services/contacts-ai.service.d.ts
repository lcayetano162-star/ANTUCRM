import { GeminiService } from '../../gemini/gemini.service';
import { PrismaService } from '../../prisma/prisma.service';
import { UserRole } from '../../auth/types/auth.types';
import { ContactAIInsight, ContactScoringResult, NextBestAction, ContactHealthScore } from '../types/contacts.types';
export declare class ContactsAIService {
    private readonly gemini;
    private readonly prisma;
    private readonly logger;
    constructor(gemini: GeminiService, prisma: PrismaService);
    generateDashboardInsights(tenantId: string, userId: string, userRole: UserRole, focus?: string): Promise<ContactAIInsight[]>;
    generateContactInsights(tenantId: string, contactId: string): Promise<ContactAIInsight[]>;
    scoreContact(tenantId: string, contactId: string): Promise<ContactScoringResult>;
    getNextBestAction(tenantId: string, contactId: string): Promise<NextBestAction>;
    getContactHealthScore(tenantId: string, contactId: string): Promise<ContactHealthScore>;
    private getDefaultInsights;
    private getDefaultScoring;
    private getDefaultNextAction;
    private getRoleBasedWhereClause;
}
