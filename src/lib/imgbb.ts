/**
 * ImgBB Image Upload Utility
 * Uploads images to ImgBB and returns the hosted URL.
 */

const IMGBB_API_KEY = import.meta.env.VITE_IMGBB;

if (!IMGBB_API_KEY) {
  console.warn("[ImgBB] Missing VITE_IMGBB API key in .env");
}

export interface ImgBBResponse {
  url: string;
  deleteUrl: string;
  thumbnail: string;
}

/**
 * Upload a File or Blob to ImgBB.
 * Returns the full-size image URL.
 */
export async function uploadToImgBB(file: File | Blob): Promise<ImgBBResponse> {
  if (!IMGBB_API_KEY) {
    throw new Error("Clé API ImgBB manquante. Ajoutez VITE_IMGBB dans votre fichier .env");
  }

  const formData = new FormData();
  formData.append("image", file);

  const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Échec de l'upload ImgBB: ${response.status} ${errorText}`);
  }

  const json = await response.json();

  if (!json.success) {
    throw new Error(`Erreur ImgBB: ${json.error?.message || "Erreur inconnue"}`);
  }

  return {
    url: json.data.url,
    deleteUrl: json.data.delete_url,
    thumbnail: json.data.thumb?.url || json.data.url,
  };
}

/**
 * Convert a base64 string to ImgBB upload.
 * Useful for camera captures that return data URLs.
 */
export async function uploadBase64ToImgBB(base64: string): Promise<ImgBBResponse> {
  if (!IMGBB_API_KEY) {
    throw new Error("Clé API ImgBB manquante. Ajoutez VITE_IMGBB dans votre fichier .env");
  }

  // Strip data URL prefix if present
  const cleanBase64 = base64.replace(/^data:image\/\w+;base64,/, "");

  const formData = new FormData();
  formData.append("image", cleanBase64);

  const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Échec de l'upload ImgBB: ${response.status} ${errorText}`);
  }

  const json = await response.json();

  if (!json.success) {
    throw new Error(`Erreur ImgBB: ${json.error?.message || "Erreur inconnue"}`);
  }

  return {
    url: json.data.url,
    deleteUrl: json.data.delete_url,
    thumbnail: json.data.thumb?.url || json.data.url,
  };
}


