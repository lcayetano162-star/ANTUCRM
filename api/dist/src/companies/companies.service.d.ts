import { PrismaService } from '../prisma/prisma.service';
import { CreateCompanyDto, UpdateCompanyDto } from './dto/company.dto';
export declare class CompaniesService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(tenantId: string, search?: string): Promise<({
        _count: {
            contacts: number;
        };
    } & {
        name: string;
        description: string | null;
        id: string;
        email: string | null;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        phone: string | null;
        industry: string | null;
        website: string | null;
        address: string | null;
        city: string | null;
        country: string | null;
        taxId: string | null;
    })[]>;
    findOne(id: string, tenantId: string): Promise<{
        contacts: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
            status: import(".prisma/client").$Enums.ContactStatus;
            phone: string;
            jobTitle: string;
        }[];
    } & {
        name: string;
        description: string | null;
        id: string;
        email: string | null;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        phone: string | null;
        industry: string | null;
        website: string | null;
        address: string | null;
        city: string | null;
        country: string | null;
        taxId: string | null;
    }>;
    create(tenantId: string, dto: CreateCompanyDto): Promise<{
        name: string;
        description: string | null;
        id: string;
        email: string | null;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        phone: string | null;
        industry: string | null;
        website: string | null;
        address: string | null;
        city: string | null;
        country: string | null;
        taxId: string | null;
    }>;
    update(id: string, tenantId: string, dto: UpdateCompanyDto): Promise<{
        name: string;
        description: string | null;
        id: string;
        email: string | null;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        phone: string | null;
        industry: string | null;
        website: string | null;
        address: string | null;
        city: string | null;
        country: string | null;
        taxId: string | null;
    }>;
    remove(id: string, tenantId: string): Promise<{
        message: string;
    }>;
    getStats(tenantId: string): Promise<{
        total: number;
        byIndustry: (import(".prisma/client").Prisma.PickEnumerable<import(".prisma/client").Prisma.CompanyGroupByOutputType, "industry"[]> & {
            _count: number;
        })[];
    }>;
}
