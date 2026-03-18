import { supabase } from "./supabase";

const BUCKET = "product-sheets";
const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

export async function uploadProductPdf(
  file: File,
  productSlug: string,
  type: "security" | "technical"
): Promise<string> {
  if (file.type !== "application/pdf") {
    throw new Error("Seuls les fichiers PDF sont acceptés.");
  }
  if (file.size > MAX_SIZE) {
    throw new Error("Le fichier ne doit pas dépasser 10 Mo.");
  }

  const ext = "pdf";
  const path = `${productSlug}/${type}-${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, {
      contentType: "application/pdf",
      upsert: false,
    });

  if (error) {
    throw new Error(`Échec de l'upload : ${error.message}`);
  }

  const { data: urlData } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(path);

  return urlData.publicUrl;
}
