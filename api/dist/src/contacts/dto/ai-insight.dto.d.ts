import { z } from 'zod';
export declare const AIInsightActionSchema: z.ZodObject<{
    label: z.ZodString;
    route: z.ZodOptional<z.ZodString>;
    params: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    params?: Record<string, any>;
    label?: string;
    route?: string;
}, {
    params?: Record<string, any>;
    label?: string;
    route?: string;
}>;
export declare const AIInsightSchema: z.ZodObject<{
    id: z.ZodString;
    type: z.ZodEnum<["CRITICAL_ALERT", "FOLLOW_UP", "OPPORTUNITY", "ENGAGEMENT", "RISK"]>;
    priority: z.ZodEnum<["CRITICAL", "HIGH", "MEDIUM", "LOW"]>;
    title: z.ZodString;
    description: z.ZodString;
    action: z.ZodObject<{
        label: z.ZodString;
        route: z.ZodOptional<z.ZodString>;
        params: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, "strip", z.ZodTypeAny, {
        params?: Record<string, any>;
        label?: string;
        route?: string;
    }, {
        params?: Record<string, any>;
        label?: string;
        route?: string;
    }>;
}, "strip", z.ZodTypeAny, {
    description?: string;
    id?: string;
    type?: "FOLLOW_UP" | "OPPORTUNITY" | "ENGAGEMENT" | "RISK" | "CRITICAL_ALERT";
    title?: string;
    action?: {
        params?: Record<string, any>;
        label?: string;
        route?: string;
    };
    priority?: "CRITICAL" | "LOW" | "MEDIUM" | "HIGH";
}, {
    description?: string;
    id?: string;
    type?: "FOLLOW_UP" | "OPPORTUNITY" | "ENGAGEMENT" | "RISK" | "CRITICAL_ALERT";
    title?: string;
    action?: {
        params?: Record<string, any>;
        label?: string;
        route?: string;
    };
    priority?: "CRITICAL" | "LOW" | "MEDIUM" | "HIGH";
}>;
declare const AIInsightDto_base: import("nestjs-zod").ZodDto<{
    description?: string;
    id?: string;
    type?: "FOLLOW_UP" | "OPPORTUNITY" | "ENGAGEMENT" | "RISK" | "CRITICAL_ALERT";
    title?: string;
    action?: {
        params?: Record<string, any>;
        label?: string;
        route?: string;
    };
    priority?: "CRITICAL" | "LOW" | "MEDIUM" | "HIGH";
}, z.ZodObjectDef<{
    id: z.ZodString;
    type: z.ZodEnum<["CRITICAL_ALERT", "FOLLOW_UP", "OPPORTUNITY", "ENGAGEMENT", "RISK"]>;
    priority: z.ZodEnum<["CRITICAL", "HIGH", "MEDIUM", "LOW"]>;
    title: z.ZodString;
    description: z.ZodString;
    action: z.ZodObject<{
        label: z.ZodString;
        route: z.ZodOptional<z.ZodString>;
        params: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, "strip", z.ZodTypeAny, {
        params?: Record<string, any>;
        label?: string;
        route?: string;
    }, {
        params?: Record<string, any>;
        label?: string;
        route?: string;
    }>;
}, "strip", z.ZodTypeAny>, {
    description?: string;
    id?: string;
    type?: "FOLLOW_UP" | "OPPORTUNITY" | "ENGAGEMENT" | "RISK" | "CRITICAL_ALERT";
    title?: string;
    action?: {
        params?: Record<string, any>;
        label?: string;
        route?: string;
    };
    priority?: "CRITICAL" | "LOW" | "MEDIUM" | "HIGH";
}>;
export declare class AIInsightDto extends AIInsightDto_base {
}
export declare const ContactScoringSchema: z.ZodObject<{
    score: z.ZodNumber;
    factors: z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        weight: z.ZodNumber;
        contribution: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        name?: string;
        weight?: number;
        contribution?: number;
    }, {
        name?: string;
        weight?: number;
        contribution?: number;
    }>, "many">;
    explanation: z.ZodString;
}, "strip", z.ZodTypeAny, {
    score?: number;
    factors?: {
        name?: string;
        weight?: number;
        contribution?: number;
    }[];
    explanation?: string;
}, {
    score?: number;
    factors?: {
        name?: string;
        weight?: number;
        contribution?: number;
    }[];
    explanation?: string;
}>;
declare const ContactScoringDto_base: import("nestjs-zod").ZodDto<{
    score?: number;
    factors?: {
        name?: string;
        weight?: number;
        contribution?: number;
    }[];
    explanation?: string;
}, z.ZodObjectDef<{
    score: z.ZodNumber;
    factors: z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        weight: z.ZodNumber;
        contribution: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        name?: string;
        weight?: number;
        contribution?: number;
    }, {
        name?: string;
        weight?: number;
        contribution?: number;
    }>, "many">;
    explanation: z.ZodString;
}, "strip", z.ZodTypeAny>, {
    score?: number;
    factors?: {
        name?: string;
        weight?: number;
        contribution?: number;
    }[];
    explanation?: string;
}>;
export declare class ContactScoringDto extends ContactScoringDto_base {
}
export declare const NextBestActionSchema: z.ZodObject<{
    action: z.ZodEnum<["CALL", "EMAIL", "MEETING", "WHATSAPP", "WAIT"]>;
    priority: z.ZodEnum<["CRITICAL", "HIGH", "MEDIUM", "LOW"]>;
    reason: z.ZodString;
    suggestedTime: z.ZodOptional<z.ZodString>;
    suggestedMessage: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    action?: "CALL" | "EMAIL" | "MEETING" | "WHATSAPP" | "WAIT";
    priority?: "CRITICAL" | "LOW" | "MEDIUM" | "HIGH";
    reason?: string;
    suggestedTime?: string;
    suggestedMessage?: string;
}, {
    action?: "CALL" | "EMAIL" | "MEETING" | "WHATSAPP" | "WAIT";
    priority?: "CRITICAL" | "LOW" | "MEDIUM" | "HIGH";
    reason?: string;
    suggestedTime?: string;
    suggestedMessage?: string;
}>;
declare const NextBestActionDto_base: import("nestjs-zod").ZodDto<{
    action?: "CALL" | "EMAIL" | "MEETING" | "WHATSAPP" | "WAIT";
    priority?: "CRITICAL" | "LOW" | "MEDIUM" | "HIGH";
    reason?: string;
    suggestedTime?: string;
    suggestedMessage?: string;
}, z.ZodObjectDef<{
    action: z.ZodEnum<["CALL", "EMAIL", "MEETING", "WHATSAPP", "WAIT"]>;
    priority: z.ZodEnum<["CRITICAL", "HIGH", "MEDIUM", "LOW"]>;
    reason: z.ZodString;
    suggestedTime: z.ZodOptional<z.ZodString>;
    suggestedMessage: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny>, {
    action?: "CALL" | "EMAIL" | "MEETING" | "WHATSAPP" | "WAIT";
    priority?: "CRITICAL" | "LOW" | "MEDIUM" | "HIGH";
    reason?: string;
    suggestedTime?: string;
    suggestedMessage?: string;
}>;
export declare class NextBestActionDto extends NextBestActionDto_base {
}
export {};
