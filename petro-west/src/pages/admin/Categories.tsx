import { useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { useListCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, Plus, X, Check } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export default function Categories() {
  const [newCatName, setNewCatName] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");

  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: categories } = useListCategories();

  const createMut = useCreateCategory({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
        setNewCatName("");
        toast({ title: "Category added." });
      }
    }
  });

  const updateMut = useUpdateCategory({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
        setEditingId(null);
        toast({ title: "Category updated." });
      }
    }
  });

  const deleteMut = useDeleteCategory({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
        toast({ title: "Category deleted." });
      },
      onError: () => {
        toast({ title: "Cannot delete category with assigned products.", variant: "destructive" });
      }
    }
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    createMut.mutate({ data: { name: newCatName } });
  };

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="font-display text-4xl text-primary mb-1">Categories</h1>
        <p className="text-muted-foreground">Manage product categories.</p>
      </div>

      <div className="max-w-3xl">
        {/* Add Form */}
        <form onSubmit={handleCreate} className="bg-white p-6 rounded-xl border mb-8 flex gap-4 items-end">
          <div className="flex-1">
            <label className="text-sm font-bold text-primary mb-2 block uppercase tracking-wider">Add New Category</label>
            <Input 
              placeholder="e.g. Engine Oils..." 
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              className="h-12"
            />
          </div>
          <Button type="submit" className="h-12 w-32 hover-elevate" disabled={createMut.isPending || !newCatName}>
            <Plus className="w-4 h-4 mr-2" /> Add
          </Button>
        </form>

        {/* List */}
        <div className="bg-white rounded-xl border overflow-hidden">
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead>Category Name</TableHead>
                <TableHead className="text-center">Products Count</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories?.map((cat) => (
                <TableRow key={cat.id}>
                  <TableCell>
                    {editingId === cat.id ? (
                      <Input 
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="max-w-xs h-9"
                        autoFocus
                      />
                    ) : (
                      <span className="font-medium text-base">{cat.name}</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary">{cat.productCount}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {editingId === cat.id ? (
                      <div className="flex justify-end gap-2">
                        <Button size="icon" variant="ghost" onClick={() => updateMut.mutate({ id: cat.id, data: { name: editName }})} disabled={updateMut.isPending}>
                          <Check className="w-4 h-4 text-green-600" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => setEditingId(null)}>
                          <X className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex justify-end gap-2">
                        <Button size="icon" variant="ghost" onClick={() => { setEditingId(cat.id); setEditName(cat.name); }}>
                          <Pencil className="w-4 h-4 text-muted-foreground" />
                        </Button>
                        <Button size="icon" variant="ghost" className="hover:bg-destructive/10 hover:text-destructive" onClick={() => deleteMut.mutate({ id: cat.id })}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </AdminLayout>
  );
}
