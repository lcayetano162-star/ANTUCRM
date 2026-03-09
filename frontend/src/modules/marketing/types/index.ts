// ============================================
// ANTU CRM - Marketing Automation Types
// Enterprise-grade marketing module
// ============================================

// Campaign Types
export type CampaignStatus = 'draft' | 'scheduled' | 'sending' | 'sent' | 'paused' | 'archived';
export type CampaignType = 'newsletter' | 'nurture' | 'promotional' | 'transactional' | 'reengagement';

export interface EmailCampaign {
  id: string;
  tenantId: string;
  name: string;
  subject: string;
  preheader?: string;
  type: CampaignType;
  status: CampaignStatus;
  // AI-generated content
  aiVariants?: {
    subjectLines: string[];
    bodyVersions: string[];
    selectedVariant: number;
  };
  // Content
  htmlContent: string;
  textContent: string;
  templateId?: string;
  // Segmentation
  segmentId?: string;
  recipientCount: number;
  // Scheduling
  scheduledAt?: Date;
  sentAt?: Date;
  // Stats
  stats: CampaignStats;
  // Tracking
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  // Audit
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CampaignStats {
  sent: number;
  delivered: number;
  bounced: number;
  opened: number;
  clicked: number;
  unsubscribed: number;
  complained: number;
  converted: number;
  // Rates
  openRate: number;
  clickRate: number;
  bounceRate: number;
  unsubscribeRate: number;
  // Revenue
  revenue?: number;
}

// Lead Types
export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'opportunity' | 'customer' | 'lost' | 'nurturing';
export type LeadSource = 'web_form' | 'landing_page' | 'api' | 'manual' | 'social' | 'referral' | 'event';

export interface Lead {
  id: string;
  tenantId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  phone?: string;
  title?: string;
  industry?: string;
  companySize?: string;
  // Enrichment data
  enrichedData?: {
    companyRevenue?: string;
    companyEmployees?: number;
    companyLocation?: string;
    socialProfiles?: {
      linkedin?: string;
      twitter?: string;
    };
    technologies?: string[];
  };
  // Scoring
  score: number;
  scoreHistory: ScoreEvent[];
  // Status
  status: LeadStatus;
  source: LeadSource;
  sourceDetail?: string;
  // Assignment
  assignedTo?: string;
  assignedAt?: Date;
  // Campaign engagement
  emailEngagement: EmailEngagement;
  webActivity: WebActivity[];
  // UTM tracking
  utmData?: UTMData;
  // Compliance
  consentGiven: boolean;
  consentDate?: Date;
  ipAddress?: string;
  // Audit
  createdAt: Date;
  updatedAt: Date;
}

export interface ScoreEvent {
  score: number;
  change: number;
  reason: string;
  timestamp: Date;
}

export interface EmailEngagement {
  emailsSent: number;
  emailsOpened: number;
  emailsClicked: number;
  lastOpenedAt?: Date;
  lastClickedAt?: Date;
  openRate: number;
  clickRate: number;
}

export interface WebActivity {
  page: string;
  timestamp: Date;
  timeOnPage: number;
  scrollDepth: number;
  referrer?: string;
}

export interface UTMData {
  source: string;
  medium: string;
  campaign?: string;
  term?: string;
  content?: string;
}

// Segment Types
export interface Segment {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  // Dynamic criteria (SQL-like builder)
  criteria: SegmentCriteria[];
  // Count
  memberCount: number;
  lastCalculatedAt?: Date;
  // Usage
  usedInCampaigns: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface SegmentCriteria {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'in' | 'not_in' | 'between';
  value: string | number | string[] | [number, number];
  connector?: 'AND' | 'OR';
}

// Form Types
export interface WebForm {
  id: string;
  tenantId: string;
  name: string;
  // Design
  title?: string;
  description?: string;
  submitButtonText: string;
  successMessage: string;
  // Fields
  fields: FormField[];
  // Logic
  conditionalLogic?: ConditionalRule[];
  // Styling
  styling: FormStyling;
  // Settings
  settings: FormSettings;
  // Stats
  views: number;
  submissions: number;
  conversionRate: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface FormField {
  id: string;
  type: 'text' | 'email' | 'phone' | 'company' | 'select' | 'checkbox' | 'textarea' | 'hidden';
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[]; // For select
  defaultValue?: string;
  validation?: {
    pattern?: string;
    minLength?: number;
    maxLength?: number;
  };
  // Progressive profiling
  showIf?: {
    field: string;
    operator: string;
    value: string;
  };
}

export interface ConditionalRule {
  if: {
    field: string;
    operator: string;
    value: string;
  };
  then: {
    action: 'show' | 'hide' | 'require';
    field: string;
  };
}

export interface FormStyling {
  backgroundColor: string;
  textColor: string;
  buttonColor: string;
  buttonTextColor: string;
  borderRadius: number;
  fontFamily: string;
}

export interface FormSettings {
  redirectUrl?: string;
  sendNotification: boolean;
  notificationEmail?: string;
  doubleOptIn: boolean;
  enableRecaptcha: boolean;
  antiSpamHoneypot: boolean;
  rateLimitPerIp: number; // per hour
}

// Landing Page Types
export interface LandingPage {
  id: string;
  tenantId: string;
  name: string;
  slug: string;
  title: string;
  metaDescription?: string;
  // Content
  sections: PageSection[];
  // Form
  formId: string;
  // Styling
  styling: LandingPageStyling;
  // SEO
  ogImage?: string;
  canonicalUrl?: string;
  // Stats
  views: number;
  conversions: number;
  conversionRate: number;
  // Publishing
  published: boolean;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface PageSection {
  id: string;
  type: 'hero' | 'features' | 'testimonials' | 'cta' | 'form' | 'text' | 'image';
  content: Record<string, unknown>;
  styling?: Record<string, string>;
}

export interface LandingPageStyling {
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  fontFamily: string;
}

// SMTP Configuration Types
export type SMTPProvider = 'aws_ses' | 'sendgrid' | 'mailgun' | 'custom';

export interface SMTPConfig {
  id: string;
  tenantId: string;
  provider: SMTPProvider;
  // Credentials (encrypted)
  credentials: {
    host?: string;
    port?: number;
    username?: string;
    password?: string;
    apiKey?: string;
    region?: string;
  };
  // Authentication
  fromEmail: string;
  fromName: string;
  replyTo?: string;
  // DNS Records
  spfRecord?: string;
  dkimRecord?: string;
  dmarcPolicy?: string;
  customDomain?: string;
  domainVerified: boolean;
  // Throttling
  dailyLimit: number;
  hourlyLimit: number;
  // Warm-up settings
  warmupEnabled: boolean;
  warmupStage: number;
  warmupDailyVolume: number;
  // Reputation
  reputationScore?: number;
  inboxPlacementRate?: number;
  blacklistStatus: string[];
  // Health
  lastHealthCheck?: Date;
  healthStatus: 'healthy' | 'degraded' | 'critical';
  createdAt: Date;
  updatedAt: Date;
}

// Email Template Types
export interface EmailTemplate {
  id: string;
  tenantId: string;
  name: string;
  category: string;
  // Content
  htmlContent: string;
  textContent: string;
  mjmlSource?: string;
  // Preview
  previewImage?: string;
  // Variables
  variables: string[];
  // Usage
  usedInCampaigns: number;
  // Meta
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Automation/Workflow Types
export interface AutomationWorkflow {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  status: 'active' | 'paused' | 'draft';
  trigger: WorkflowTrigger;
  steps: WorkflowStep[];
  enrolledLeads: number;
  completedLeads: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkflowTrigger {
  type: 'form_submission' | 'tag_added' | 'score_reached' | 'email_opened' | 'email_clicked' | 'page_visited' | 'date_based';
  config: Record<string, unknown>;
}

export interface WorkflowStep {
  id: string;
  type: 'delay' | 'email' | 'condition' | 'tag' | 'score' | 'webhook' | 'notification';
  config: Record<string, unknown>;
  nextStepId?: string;
}

// Analytics Types
export interface MarketingAnalytics {
  period: {
    start: Date;
    end: Date;
  };
  emails: {
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    bounced: number;
    complained: number;
    unsubscribed: number;
  };
  leads: {
    new: number;
    converted: number;
    avgScore: number;
    bySource: Record<string, number>;
  };
  campaigns: {
    active: number;
    totalSent: number;
    avgOpenRate: number;
    avgClickRate: number;
  };
  revenue?: number;
}

// Tracking Types
export interface TrackingEvent {
  id: string;
  tenantId: string;
  leadId?: string;
  email?: string;
  eventType: 'email_open' | 'email_click' | 'page_view' | 'form_submit' | 'conversion';
  // Event data
  campaignId?: string;
  emailId?: string;
  url?: string;
  pageTitle?: string;
  // Device info
  userAgent: string;
  ipAddress: string;
  deviceType: 'desktop' | 'mobile' | 'tablet';
  browser: string;
  os: string;
  // Location
  country?: string;
  city?: string;
  // Engagement
  timeOnPage?: number;
  scrollDepth?: number;
  // Timestamp
  timestamp: Date;
}
