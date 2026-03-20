import { useState, useRef } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { useListCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, Plus, X, Check, Upload, Loader2, ImageIcon } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { uploadToImgBB } from "@/lib/imgbb";
import { useTranslation } from "react-i18next";

export default function Categories() {
  const { t } = useTranslation();
  const [newCatName, setNewCatName] = useState("");
  const [newCatImage, setNewCatImage] = useState<string | null>(null);
  const [uploadingNew, setUploadingNew] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editImage, setEditImage] = useState<string | null>(null);
  const [uploadingEdit, setUploadingEdit] = useState(false);

  const newImageRef = useRef<HTMLInputElement>(null);
  const editImageRef = useRef<HTMLInputElement>(null);

  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: categories } = useListCategories();

  const createMut = useCreateCategory({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
        setNewCatName("");
        setNewCatImage(null);
        toast({ title: t("admin.categories.toastAdded") });
      },
    },
  });

  const updateMut = useUpdateCategory({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
        setEditingId(null);
        setEditImage(null);
        toast({ title: t("admin.categories.toastUpdated") });
      },
    },
  });

  const deleteMut = useDeleteCategory({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
        toast({ title: t("admin.categories.toastDeleted") });
      },
      onError: () => {
        toast({ title: t("admin.categories.toastDeleteErr"), variant: "destructive" });
      },
    },
  });

  const handleNewImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setUploadingNew(true);
    try {
      const result = await uploadToImgBB(file);
      setNewCatImage(result.url);
      toast({ title: t("admin.categories.toastImgOk") });
    } catch (err: any) {
      toast({ title: err.message || t("admin.categories.toastUploadErr"), variant: "destructive" });
    } finally {
      setUploadingNew(false);
    }
  };

  const handleEditImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setUploadingEdit(true);
    try {
      const result = await uploadToImgBB(file);
      setEditImage(result.url);
      toast({ title: t("admin.categories.toastImgOk") });
    } catch (err: any) {
      toast({ title: err.message || t("admin.categories.toastUploadErr"), variant: "destructive" });
    } finally {
      setUploadingEdit(false);
    }
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    createMut.mutate({ data: { name: newCatName, image: newCatImage } });
  };

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="font-display text-4xl text-primary mb-1">{t("admin.categories.title")}</h1>
        <p className="text-muted-foreground">{t("admin.categories.subtitle")}</p>
      </div>

      <div className="max-w-4xl">
        <form onSubmit={handleCreate} className="bg-white p-6 rounded-xl border mb-8">
          <label className="text-sm font-bold text-primary mb-4 block uppercase tracking-wider">{t("admin.categories.addNewSection")}</label>
          <div className="flex gap-4 items-end flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <Input
                placeholder={t("admin.categories.newNamePh")}
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                className="h-12"
              />
            </div>

            <div className="flex items-center gap-2">
              <input ref={newImageRef} type="file" accept="image/*" onChange={handleNewImageUpload} className="hidden" />
              {newCatImage ? (
                <div className="relative">
                  <img src={newCatImage} alt="" className="w-12 h-12 rounded-lg object-cover border" />
                  <button type="button" onClick={() => setNewCatImage(null)} className="absolute -top-1 -end-1 bg-red-500 text-white rounded-full p-0.5">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <Button type="button" variant="outline" size="icon" className="h-12 w-12" onClick={() => newImageRef.current?.click()} disabled={uploadingNew}>
                  {uploadingNew ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                </Button>
              )}
            </div>

            <Button type="submit" className="h-12 w-32 hover-elevate" disabled={createMut.isPending || !newCatName}>
              <Plus className="w-4 h-4 me-2" /> {t("admin.categories.add")}
            </Button>
          </div>
        </form>

        <div className="bg-white rounded-xl border overflow-hidden">
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead className="w-16">{t("admin.categories.colImage")}</TableHead>
                <TableHead>{t("admin.categories.colName")}</TableHead>
                <TableHead className="text-center">{t("admin.categories.colProducts")}</TableHead>
                <TableHead className="text-end">{t("admin.categories.colActions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories?.map((cat: any) => (
                <TableRow key={cat.id}>
                  <TableCell>
                    {editingId === cat.id ? (
                      <div className="relative">
                        <input ref={editImageRef} type="file" accept="image/*" onChange={handleEditImageUpload} className="hidden" />
                        {editImage || cat.image ? (
                          <div className="relative inline-block">
                            <img
                              src={editImage || cat.image}
                              alt=""
                              className="w-10 h-10 rounded-lg object-cover border cursor-pointer"
                              onClick={() => editImageRef.current?.click()}
                            />
                            <button type="button" onClick={() => setEditImage("")} className="absolute -top-1 -end-1 bg-red-500 text-white rounded-full p-0.5">
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => editImageRef.current?.click()}
                            className="w-10 h-10 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50"
                            disabled={uploadingEdit}
                          >
                            {uploadingEdit ? <Loader2 className="w-3 h-3 animate-spin" /> : <ImageIcon className="w-3 h-3 text-gray-400" />}
                          </button>
                        )}
                      </div>
                    ) : cat.image ? (
                      <img src={cat.image} alt={cat.name} className="w-10 h-10 rounded-lg object-cover border" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                        <ImageIcon className="w-4 h-4 text-gray-400" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {editingId === cat.id ? (
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="max-w-xs h-9"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            updateMut.mutate({ id: cat.id, data: { name: editName, image: editImage !== null ? editImage : cat.image } });
                          }
                          if (e.key === "Escape") {
                            setEditingId(null);
                            setEditImage(null);
                          }
                        }}
                      />
                    ) : (
                      <span className="font-medium text-base">{cat.name}</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary">{cat.productCount}</Badge>
                  </TableCell>
                  <TableCell className="text-end">
                    {editingId === cat.id ? (
                      <div className="flex justify-end gap-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() =>
                            updateMut.mutate({ id: cat.id, data: { name: editName, image: editImage !== null ? editImage : cat.image } })
                          }
                          disabled={updateMut.isPending}
                        >
                          <Check className="w-4 h-4 text-green-600" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            setEditingId(null);
                            setEditImage(null);
                          }}
                        >
                          <X className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex justify-end gap-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            setEditingId(cat.id);
                            setEditName(cat.name);
                            setEditImage(cat.image || null);
                          }}
                        >
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
