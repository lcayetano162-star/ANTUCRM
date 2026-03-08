// ============================================
// EMAIL PAGE - Página principal de email bidireccional
// ============================================

import { useState } from 'react';
import { EmailInbox } from '@/components/email/EmailInbox';
import { EmailConversation } from '@/components/email/EmailConversation';
import { EmailComposer } from '@/components/email/EmailComposer';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Settings, Plus } from 'lucide-react';

interface Conversation {
  id: string;
  subject: string;
  client_name?: string;
}

export default function Email() {
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [showComposer, setShowComposer] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  return (
    <div className="h-[calc(100vh-4rem)] flex">
      {/* Sidebar - Inbox */}
      <div className="w-1/3 border-r bg-white">
        <EmailInbox
          onSelectConversation={(conv) => setSelectedConversation(conv)}
          onCompose={() => setShowComposer(true)}
        />
      </div>

      {/* Main - Conversation */}
      <div className="flex-1 bg-gray-50">
        {selectedConversation ? (
          <EmailConversation
            conversationId={selectedConversation.id}
            onBack={() => setSelectedConversation(null)}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-12 h-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-lg font-medium">Selecciona una conversación</p>
            <p className="text-sm">O inicia una nueva desde la bandeja de entrada</p>
            
            <div className="flex gap-2 mt-6">
              <Button onClick={() => setShowComposer(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Email
              </Button>
              <Button variant="outline" onClick={() => setShowSettings(true)}>
                <Settings className="w-4 h-4 mr-2" />
                Configurar
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Composer Dialog */}
      <Dialog open={showComposer} onOpenChange={setShowComposer}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nuevo Email</DialogTitle>
          </DialogHeader>
          <EmailComposer
            onSent={() => setShowComposer(false)}
            onCancel={() => setShowComposer(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
