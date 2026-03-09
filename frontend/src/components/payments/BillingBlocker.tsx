import { ShieldAlert, CreditCard, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTenant } from '@/contexts/TenantContext';

export function BillingBlocker() {
    const { tenant, lockReason } = useTenant();

    return (
        <div className="fixed inset-0 z-[9999] bg-slate-900/95 backdrop-blur-md flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-500">
                <div className="p-1 px-1 bg-gradient-to-r from-red-500 via-orange-500 to-amber-500">
                    <div className="bg-white rounded-[22px] p-8 flex flex-col items-center text-center">
                        {/* Icon Circle */}
                        <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mb-6 relative">
                            <ShieldAlert className="w-10 h-10 text-red-600" />
                            <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-red-600 border-4 border-white flex items-center justify-center">
                                <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                            </div>
                        </div>

                        {/* Content */}
                        <h2 className="text-2xl font-black text-slate-900 mb-2">Acceso Restringido</h2>
                        <div className="inline-block px-3 py-1 bg-red-50 text-red-700 text-[10px] font-bold uppercase tracking-wider rounded-full mb-6">
                            {lockReason || 'Suscripción Pendiente'}
                        </div>

                        <p className="text-slate-600 mb-8 leading-relaxed">
                            Lo sentimos, el acceso a <span className="font-bold text-slate-900">{tenant.name}</span> ha sido pausado temporalmente debido a un problema con tu suscripción actual.
                        </p>

                        {/* Action Buttons */}
                        <div className="w-full flex flex-col gap-3">
                            <Button
                                onClick={() => window.location.href = '/settings?tab=billing'}
                                className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold flex items-center justify-center gap-2"
                            >
                                <CreditCard className="w-4 h-4" />
                                Gestionar Suscripción
                            </Button>

                            <Button
                                variant="outline"
                                onClick={() => window.open('mailto:soporte@antucrm.com', '_blank')}
                                className="w-full h-12 border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl font-bold flex items-center justify-center gap-2"
                            >
                                <Mail className="w-4 h-4" />
                                Contactar Soporte
                            </Button>
                        </div>

                        <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-center gap-2">
                            <span className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">Powered by</span>
                            <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Antü AI</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
