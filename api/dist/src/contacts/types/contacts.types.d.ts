export type ContactStatus = 'ACTIVE' | 'INACTIVE' | 'PROSPECT' | 'CUSTOMER' | 'CHURNED';
export interface ContactTag {
    id: string;
    name: string;
    color: string;
}
export interface ContactAvatar {
    initials: string;
    color: string;
    imageUrl?: string;
}
export interface ContactCompany {
    id: string;
    name: string;
    industry?: string;
    website?: string;
    address?: string;
    city?: string;
    country?: string;
}
export interface ContactAssignedTo {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
    avatar?: string;
}
export interface ContactLastActivity {
    date: Date;
    type: string;
    description: string;
    daysAgo: number;
}
export interface ContactOpportunities {
    count: number;
    totalValue: number;
}
export interface ContactCard {
    id: string;
    avatar: ContactAvatar;
    fullName: string;
    jobTitle?: string;
    isMainContact: boolean;
    company?: ContactCompany;
    email?: string;
    phone?: string;
    hasWhatsApp: boolean;
    status: ContactStatus;
    score: number;
    lastActivity?: ContactLastActivity;
    pendingTasks: number;
    opportunities: ContactOpportunities;
    tags: ContactTag[];
}
export interface ContactActivity {
    id: string;
    type: string;
    description: string;
    date: Date;
    createdBy?: {
        id: string;
        firstName: string;
        lastName: string;
    };
}
export interface ContactOpportunity {
    id: string;
    name: string;
    stage: string;
    value?: number;
    probability?: number;
    expectedCloseDate?: Date;
    status: string;
}
export interface ContactNote {
    id: string;
    content: string;
    createdAt: Date;
    createdBy?: {
        id: string;
        firstName: string;
        lastName: string;
        avatar?: string;
    };
}
export interface ContactDetail extends Omit<ContactCard, 'opportunities'> {
    company?: ContactCompany;
    assignedTo?: ContactAssignedTo;
    activities: ContactActivity[];
    opportunities: ContactOpportunity[];
    notes: ContactNote[];
    aiInsights: ContactAIInsight[];
    healthScore?: ContactHealthScore;
    createdAt: Date;
    updatedAt: Date;
}
export interface ContactAIInsight {
    id: string;
    type: 'CRITICAL_ALERT' | 'FOLLOW_UP' | 'OPPORTUNITY' | 'ENGAGEMENT' | 'RISK';
    priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
    title: string;
    description: string;
    action: {
        label: string;
        route?: string;
        params?: Record<string, any>;
    };
}
export interface ContactKPI {
    value: number;
    trend?: number;
    target?: number;
}
export interface ContactKPIs {
    totalContacts: ContactKPI;
    mainContacts: ContactKPI;
    activeContacts: ContactKPI;
    newContactsThisMonth: ContactKPI;
    contactsWithOpportunities: ContactKPI;
}
export interface ContactFilterOption {
    value: string;
    label: string;
    count?: number;
    color?: string;
}
export interface ContactFilter {
    id: string;
    label: string;
    type: 'select' | 'multiSelect' | 'dateRange' | 'search';
    options: ContactFilterOption[];
}
export interface PaginationInfo {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}
export interface ContactsDashboard {
    aiInsights: ContactAIInsight[];
    kpis: ContactKPIs;
    filters: ContactFilter[];
    contacts: ContactCard[];
    pagination: PaginationInfo;
}
export interface ContactScoringResult {
    score: number;
    factors: Array<{
        name: string;
        weight: number;
        contribution: number;
    }>;
    explanation: string;
}
export interface NextBestAction {
    action: 'CALL' | 'EMAIL' | 'MEETING' | 'WHATSAPP' | 'WAIT';
    priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
    reason: string;
    suggestedTime?: string;
    suggestedMessage?: string;
}
export interface ContactHealthScore {
    overall: number;
    engagement: number;
    responseTime: number;
    activityFrequency: number;
    lastActivity: number;
    trend: 'IMPROVING' | 'STABLE' | 'DECLINING';
}
export interface BulkActionResult {
    success: boolean;
    processedCount: number;
    failedCount: number;
    failedIds?: string[];
}
