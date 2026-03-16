import { useState } from "react";
import { Link } from "wouter";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { useListProducts, useToggleProductStock, useDeleteProduct } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Search, PlusCircle, Pencil, Trash2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function Products() {
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);
  
  const { data: productsData } = useListProducts({ search: search || undefined, limit: 100 });
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const toggleMutation = useToggleProductStock({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/products"] });
        toast({ title: "Stock status updated." });
      }
    }
  });

  const deleteMutation = useDeleteProduct({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/products"] });
        toast({ title: "Product deleted successfully." });
        setDeleteId(null);
      }
    }
  });

  return (
    <AdminLayout>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="font-display text-4xl text-primary mb-1">Products</h1>
          <p className="text-muted-foreground">Manage your product catalog.</p>
        </div>
        <Button asChild variant="secondary" className="hover-elevate">
          <Link href="/admin/products/new"><PlusCircle className="w-4 h-4 mr-2"/> Add New Product</Link>
        </Button>
      </div>

      <div className="bg-white p-4 rounded-xl border mb-6 flex gap-4 items-center">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search products..." 
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead className="w-16">Image</TableHead>
                <TableHead>Product Name</TableHead>
                <TableHead>Brand</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Price (DA)</TableHead>
                <TableHead className="text-center">In Stock</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {productsData?.products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <div className="w-10 h-10 rounded bg-gray-100 p-1">
                      <img src={product.images?.[0] || "https://images.unsplash.com/photo-1623815148007-850d995cb4d5?w=100&h=100&fit=crop"} className="w-full h-full object-contain mix-blend-multiply" alt=""/>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium max-w-[250px] truncate">{product.name}</TableCell>
                  <TableCell>{product.brandName}</TableCell>
                  <TableCell>{product.categoryName || '-'}</TableCell>
                  <TableCell className="font-bold">{product.price.toLocaleString()}</TableCell>
                  <TableCell className="text-center">
                    <Switch 
                      checked={product.inStock} 
                      onCheckedChange={(c) => toggleMutation.mutate({ id: product.id, data: { inStock: c } })}
                      disabled={toggleMutation.isPending}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button asChild variant="ghost" size="icon" className="hover:text-primary">
                        <Link href={`/admin/products/${product.id}/edit`}><Pencil className="w-4 h-4"/></Link>
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => setDeleteId(product.id)}>
                        <Trash2 className="w-4 h-4"/>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {productsData?.products.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No products found.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the product. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteId && deleteMutation.mutate({ id: deleteId })}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </AdminLayout>
  );
}
