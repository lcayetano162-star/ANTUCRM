// ============================================
// ANTU CRM - Product Recommendations Component
// Recomendaciones de productos basadas en IA
// ============================================

import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Package,
  TrendingUp,
  Users,
  Plus,
  Eye,
} from 'lucide-react';
import { toast } from 'sonner';
import type { ProductRecommendation } from '@/types/customer';

// ============================================
// PROPS
// ============================================

interface ProductRecommendationsProps {
  recommendations: ProductRecommendation[];
  currency: string;
}

// ============================================
// COMPONENT
// ============================================

export function ProductRecommendations({ recommendations, currency }: ProductRecommendationsProps) {
  const navigate = useNavigate();
  
  if (recommendations.length === 0) {
    return (
      <div className="bg-slate-50 rounded-xl p-6 border border-slate-200 text-center">
        <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h4 className="font-medium text-slate-700 mb-1">Sin recomendaciones</h4>
        <p className="text-sm text-slate-500">
          La IA está analizando el perfil del cliente para generar recomendaciones.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-500 mb-3">
        Basado en su perfil y empresas similares:
      </p>

      {recommendations.map((rec) => (
        <div
          key={rec.id}
          className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition-all"
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-100 to-blue-100 flex items-center justify-center">
                <Package className="w-5 h-5 text-cyan-600" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-800">{rec.productName}</span>
                  <Badge className="bg-emerald-100 text-emerald-700 text-xs">
                    {rec.matchScore}% match
                  </Badge>
                </div>
                <p className="text-xs text-slate-500">{rec.productCode}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-bold text-emerald-600">
                {currency} {rec.potentialValue.toLocaleString()}
              </p>
              <p className="text-xs text-slate-400">potencial/año</p>
            </div>
          </div>

          {/* Reason */}
          <div className="bg-slate-50 rounded-lg p-3 mb-3">
            <div className="flex items-start gap-2">
              <TrendingUp className="w-4 h-4 text-slate-400 mt-0.5" />
              <p className="text-sm text-slate-600">{rec.reason}</p>
            </div>
          </div>

          {/* Similar Customers */}
          {rec.similarCustomers.length > 0 && (
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
              <Users className="w-4 h-4" />
              <span>Clientes similares que compraron:</span>
              <span className="font-medium text-slate-700">
                {rec.similarCustomers.join(', ')}
              </span>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <Button 
              size="sm" 
              variant="outline" 
              className="flex-1"
              onClick={() => navigate('/inventory')}
            >
              <Eye className="w-4 h-4 mr-1" />
              Ver detalles
            </Button>
            <Button 
              size="sm" 
              className="flex-1 bg-cyan-600 hover:bg-cyan-700"
              onClick={() => {
                navigate('/cotizaciones', { 
                  state: { 
                    productRecommendation: rec 
                  } 
                });
                toast.success(`${rec.productName} agregado a cotización`);
              }}
            >
              <Plus className="w-4 h-4 mr-1" />
              Agregar a cotización
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default ProductRecommendations;
