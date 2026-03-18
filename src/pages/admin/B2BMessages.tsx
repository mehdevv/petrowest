import { useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import {
  useListB2BMessages,
  useUpdateB2BMessage,
  useDeleteB2BMessage,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Search,
  Mail,
  MailOpen,
  Trash2,
  Building2,
  Phone,
  AtSign,
  ChevronLeft,
  ChevronRight,
  Eye,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

type B2BMsg = {
  id: number;
  company: string;
  phone: string;
  email: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  is_read?: boolean;
  created_at?: string;
};

function normalizeMsg(m: any): B2BMsg {
  return {
    id: m.id,
    company: m.company,
    phone: m.phone,
    email: m.email,
    message: m.message,
    isRead: m.isRead ?? m.is_read ?? false,
    createdAt: m.createdAt ?? m.created_at ?? "",
  };
}

export default function B2BMessages() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [filterRead, setFilterRead] = useState<"all" | "unread" | "read">("all");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<B2BMsg | null>(null);
  const limit = 20;

  const { data, isLoading } = useListB2BMessages({
    search: search || undefined,
    isRead: filterRead === "all" ? undefined : filterRead === "read",
    page,
    limit,
  });

  const messages: B2BMsg[] = (data?.messages || []).map(normalizeMsg);
  const total = data?.total || 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  const updateMsg = useUpdateB2BMessage({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/b2b-messages"] });
        queryClient.invalidateQueries({ queryKey: ["/api/b2b-messages/unread-count"] });
      },
    },
  });

  const deleteMsg = useDeleteB2BMessage({
    mutation: {
      onSuccess: () => {
        toast({ title: "Message supprimé" });
        setSelected(null);
        queryClient.invalidateQueries({ queryKey: ["/api/b2b-messages"] });
        queryClient.invalidateQueries({ queryKey: ["/api/b2b-messages/unread-count"] });
      },
    },
  });

  const handleOpen = (msg: B2BMsg) => {
    setSelected(msg);
    if (!msg.isRead) {
      updateMsg.mutate({ id: msg.id, data: { isRead: true } });
    }
  };

  const handleToggleRead = (msg: B2BMsg) => {
    updateMsg.mutate({ id: msg.id, data: { isRead: !msg.isRead } });
  };

  return (
    <AdminLayout>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="font-display text-4xl text-primary mb-1">Messages B2B</h1>
          <p className="text-muted-foreground">
            Demandes de contact des professionnels.
          </p>
        </div>
        <Badge variant="outline" className="text-lg px-4 py-1">
          {total} message{total !== 1 ? "s" : ""}
        </Badge>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par entreprise ou e-mail..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          {(["all", "unread", "read"] as const).map((f) => (
            <Button
              key={f}
              variant={filterRead === f ? "default" : "outline"}
              size="sm"
              onClick={() => { setFilterRead(f); setPage(1); }}
            >
              {f === "all" ? "Tous" : f === "unread" ? "Non lus" : "Lus"}
            </Button>
          ))}
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Boîte de réception</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10"></TableHead>
                  <TableHead>Entreprise</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Téléphone</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                      Chargement...
                    </TableCell>
                  </TableRow>
                ) : messages.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                      Aucun message B2B.
                    </TableCell>
                  </TableRow>
                ) : (
                  messages.map((msg) => (
                    <TableRow
                      key={msg.id}
                      className={`cursor-pointer transition-colors ${
                        !msg.isRead ? "bg-blue-50/60 font-medium" : ""
                      }`}
                      onClick={() => handleOpen(msg)}
                    >
                      <TableCell>
                        {msg.isRead ? (
                          <MailOpen className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <Mail className="w-4 h-4 text-blue-600" />
                        )}
                      </TableCell>
                      <TableCell className="font-semibold">{msg.company}</TableCell>
                      <TableCell className="text-sm">{msg.email}</TableCell>
                      <TableCell className="text-sm">{msg.phone}</TableCell>
                      <TableCell className="max-w-[250px] truncate text-sm text-muted-foreground">
                        {msg.message}
                      </TableCell>
                      <TableCell className="text-sm whitespace-nowrap">
                        {msg.createdAt
                          ? format(new Date(msg.createdAt), "d MMM yyyy HH:mm", { locale: fr })
                          : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Voir"
                            onClick={() => handleOpen(msg)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            title={msg.isRead ? "Marquer non lu" : "Marquer lu"}
                            onClick={() => handleToggleRead(msg)}
                          >
                            {msg.isRead ? <Mail className="w-4 h-4" /> : <MailOpen className="w-4 h-4" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            title="Supprimer"
                            onClick={() => deleteMsg.mutate({ id: msg.id })}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Page {page} / {totalPages} ({total} résultats)
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Sheet */}
      <Sheet open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader className="pb-6 border-b mb-6">
            <SheetTitle className="font-display text-2xl text-primary">
              Message B2B
            </SheetTitle>
          </SheetHeader>
          {selected && (
            <div className="space-y-6">
              <div className="flex items-start gap-3">
                <Building2 className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Entreprise</p>
                  <p className="text-lg font-semibold">{selected.company}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Téléphone</p>
                  <a href={`tel:${selected.phone}`} className="text-lg font-semibold text-secondary hover:underline">
                    {selected.phone}
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <AtSign className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">E-mail</p>
                  <a href={`mailto:${selected.email}`} className="text-lg font-semibold text-secondary hover:underline">
                    {selected.email}
                  </a>
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold mb-2">Message</p>
                <div className="bg-gray-50 border rounded-xl p-5 whitespace-pre-wrap text-sm leading-relaxed">
                  {selected.message}
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                Reçu le{" "}
                {selected.createdAt
                  ? format(new Date(selected.createdAt), "EEEE d MMMM yyyy 'à' HH:mm", { locale: fr })
                  : "—"}
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => handleToggleRead(selected)}
                >
                  {selected.isRead ? (
                    <><Mail className="w-4 h-4 mr-2" /> Marquer non lu</>
                  ) : (
                    <><MailOpen className="w-4 h-4 mr-2" /> Marquer lu</>
                  )}
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => deleteMsg.mutate({ id: selected.id })}
                  disabled={deleteMsg.isPending}
                >
                  <Trash2 className="w-4 h-4 mr-2" /> Supprimer
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </AdminLayout>
  );
}
