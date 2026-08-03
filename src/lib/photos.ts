import { supabase } from "@/integrations/supabase/client";

export const PHOTO_BUCKET = "member-photos";

export async function uploadMemberPhoto(file: Blob, ext = "jpg") {
  const path = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(PHOTO_BUCKET).upload(path, file, {
    contentType: file.type || "image/jpeg",
    upsert: false,
  });
  if (error) throw error;
  return path;
}

export async function getPhotoUrl(path: string | null | undefined) {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  const { data, error } = await supabase.storage.from(PHOTO_BUCKET).createSignedUrl(path, 60 * 60);
  if (error) return null;
  return data.signedUrl;
}

export function dataUrlToBlob(dataUrl: string) {
  const [meta, base64] = dataUrl.split(",");
  const mime = /:(.*?);/.exec(meta ?? "")?.[1] ?? "image/jpeg";
  const binary = atob(base64 ?? "");
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}