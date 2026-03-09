import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileSearch, CheckCircle, XCircle, Clock, ArrowRight } from 'lucide-react';
import type { CreditRequest, CreditRequestStatus } from '@/types/receivables';

interface CreditRequestsListProps {
  requests: CreditRequest[];
  onEvaluate: (request: CreditRequest) => void;
  onStartReview: (requestId: string) => void;
}

export function CreditRequestsList({ requests, onEvaluate, onStartReview }: CreditRequestsListProps) {
  const [activeTab, setActiveTab] = useState<CreditRequestStatus | 'ALL'>('PENDING');

  const filteredRequests = activeTab === 'ALL' 
    ? requests 
    : requests.filter(r => r.status === activeTab);

  const getStatusBadge = (status: CreditRequestStatus) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Pendiente</Badge>;
      case 'IN_REVIEW':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">En Revisión</Badge>;
      case 'APPROVED':
        return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">Aprobada</Badge>;
      case 'CONDITIONAL':
        return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">Condicionada</Badge>;
      case 'REJECTED':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Rechazada</Badge>;
      case 'EXPIRED':
        return <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200">Expirada</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getRiskBadge = (score: number, level: string) => {
    const colors = {
      LOW: 'bg-emerald-100 text-emerald-700',
      MEDIUM: 'bg-amber-100 text-amber-700',
      HIGH: 'bg-red-100 text-red-700',
      CRITICAL: 'bg-red-900 text-white',
    };
    
    return (
      <div className="flex items-center gap-2">
        <span className="font-semibold">{score}/100</span>
        <Badge className={`${colors[level as keyof typeof colors] || 'bg-slate-100'}`}>
          {level === 'LOW' ? 'Bajo' : level === 'MEDIUM' ? 'Medio' : level === 'HIGH' ? 'Alto' : 'Crítico'}
        </Badge>
      </div>
    );
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency: 'DOP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const tabs: { value: CreditRequestStatus | 'ALL'; label: string; count: number }[] = [
    { value: 'PENDING', label: 'Pendientes', count: requests.filter(r => r.status === 'PENDING').length },
    { value: 'IN_REVIEW', label: 'En Revisión', count: requests.filter(r => r.status === 'IN_REVIEW').length },
    { value: 'APPROVED', label: 'Aprobadas', count: requests.filter(r => r.status === 'APPROVED' || r.status === 'CONDITIONAL').length },
    { value: 'REJECTED', label: 'Rechazadas', count: requests.filter(r => r.status === 'REJECTED').length },
    { value: 'ALL', label: 'Todas', count: requests.length },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Solicitudes de Crédito</CardTitle>
          <Button variant="outline" size="sm">
            Configurar
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as CreditRequestStatus | 'ALL')}>
          <TabsList className="mb-4">
            {tabs.map(tab => (
              <TabsTrigger key={tab.value} value={tab.value} className="relative">
                {tab.label}
                {tab.count > 0 && (
                  <span className="ml-1.5 text-xs bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded-full">
                    {tab.count}
                  </span>
                )}
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead>Cliente</TableHead>
                  <TableHead>Solicitado por</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                  <TableHead>Score IA / Riesgo</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                      No hay solicitudes en este estado
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRequests.map((request) => (
                    <TableRow key={request.id} className="hover:bg-slate-50">
                      <TableCell>
                        <div>
                          <p className="font-medium text-slate-900">{request.customerName}</p>
                          <p className="text-xs text-slate-500">RNC: {request.customerRNC}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm">{request.requestedBy}</p>
                          <p className="text-xs text-slate-500">{request.requestDate}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(request.requestedAmount)}
                      </TableCell>
                      <TableCell>
                        {getRiskBadge(request.aiScore, request.riskLevel)}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(request.status)}
                      </TableCell>
                      <TableCell className="text-right">
                        {request.status === 'PENDING' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onStartReview(request.id)}
                          >
                            <Clock className="h-4 w-4 mr-1" />
                            Iniciar revisión
                          </Button>
                        )}
                        {request.status === 'IN_REVIEW' && (
                          <Button
                            size="sm"
                            onClick={() => onEvaluate(request)}
                          >
                            <FileSearch className="h-4 w-4 mr-1" />
                            Evaluar
                            <ArrowRight className="h-4 w-4 ml-1" />
                          </Button>
                        )}
                        {(request.status === 'APPROVED' || request.status === 'CONDITIONAL') && (
                          <div className="flex items-center justify-end gap-2 text-emerald-600">
                            <CheckCircle className="h-4 w-4" />
                            <span className="text-sm">
                              {formatCurrency(request.approvedAmount || 0)}
                            </span>
                          </div>
                        )}
                        {request.status === 'REJECTED' && (
                          <div className="flex items-center justify-end gap-2 text-red-600">
                            <XCircle className="h-4 w-4" />
                            <span className="text-sm text-slate-500">Rechazada</span>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Tabs>

        {/* Resumen de Cartera */}
        <div className="mt-6 grid grid-cols-4 gap-4 p-4 bg-slate-50 rounded-lg">
          <div className="text-center">
            <p className="text-2xl font-bold text-slate-900">45</p>
            <p className="text-xs text-slate-500">Líneas aprobadas</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-slate-900">$12.5M</p>
            <p className="text-xs text-slate-500">Exposición actual</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-emerald-600">$8.2M</p>
            <p className="text-xs text-slate-500">Disponible</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-amber-600">8</p>
            <p className="text-xs text-slate-500">En revisión</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
