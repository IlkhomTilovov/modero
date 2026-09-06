import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAdminT } from '@/hooks/useAdminT';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Mail, MailOpen, Trash2, Phone, Clock } from 'lucide-react';
import { format } from 'date-fns';

export default function Messages() {
  const { toast } = useToast();
  const t = useAdminT();
  const queryClient = useQueryClient();
  const [selectedMessage, setSelectedMessage] = useState<any>(null);

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['contact-messages'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contact_messages')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const markAsRead = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('contact_messages')
        .update({ is_read: true })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['contact-messages'] }),
  });

  const deleteMessage = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('contact_messages')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-messages'] });
      toast({ title: t.messages.deleted });
    },
  });

  const openMessage = (msg: any) => {
    setSelectedMessage(msg);
    if (!msg.is_read) {
      markAsRead.mutate(msg.id);
    }
  };

  const unreadCount = messages.filter((m: any) => !m.is_read).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t.messages.title}</h1>
          <p className="text-muted-foreground text-sm">
            {t.messages.subtitle}
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2">{unreadCount} {t.messages.newBadge}</Badge>
            )}
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-10 text-muted-foreground">{t.messages.loading}</div>
      ) : messages.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground">{t.messages.empty}</div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10"></TableHead>
                <TableHead>{t.messages.name}</TableHead>
                <TableHead>{t.messages.phone}</TableHead>
                <TableHead>{t.messages.email}</TableHead>
                <TableHead>{t.messages.message}</TableHead>
                <TableHead>{t.messages.date}</TableHead>
                <TableHead className="w-20">{t.messages.actions}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {messages.map((msg: any) => (
                <TableRow
                  key={msg.id}
                  className={`cursor-pointer ${!msg.is_read ? 'bg-primary/5 font-medium' : ''}`}
                  onClick={() => openMessage(msg)}
                >
                  <TableCell>
                    {msg.is_read ? (
                      <MailOpen className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <Mail className="w-4 h-4 text-primary" />
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{msg.name}</TableCell>
                  <TableCell>{msg.phone}</TableCell>
                  <TableCell>{msg.email || '-'}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{msg.message}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(msg.created_at), 'dd.MM.yyyy HH:mm')}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteMessage.mutate(msg.id);
                      }}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={!!selectedMessage} onOpenChange={() => setSelectedMessage(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t.messages.details}</DialogTitle>
          </DialogHeader>
          {selectedMessage && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="font-semibold">{selectedMessage.name}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="w-4 h-4" />
                <a href={`tel:${selectedMessage.phone}`} className="hover:text-primary">
                  {selectedMessage.phone}
                </a>
              </div>
              {selectedMessage.email && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="w-4 h-4" />
                  <a href={`mailto:${selectedMessage.email}`} className="hover:text-primary">
                    {selectedMessage.email}
                  </a>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                {format(new Date(selectedMessage.created_at), 'dd.MM.yyyy HH:mm')}
              </div>
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm whitespace-pre-wrap">{selectedMessage.message}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
