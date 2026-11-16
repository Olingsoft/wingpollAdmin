export interface CloudinaryUploadResult {
  secureUrl: string;
  publicId: string;
  resourceType: "image" | "video" | "raw" | string;
  format?: string;
  bytes: number;
  originalFilename: string;
  duration?: number;
}

/**
 * Uploads any file (video, image, PDF, document) directly to Cloudinary
 * using a server-generated SHA-1 signature from /api/cloudinary/sign.
 */
export async function uploadToCloudinary(
  file: File,
  folder = "wingpoll_tasks"
): Promise<CloudinaryUploadResult> {
  // 1. Request a signed upload token from our Next.js API route
  const signRes = await fetch("/api/cloudinary/sign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ folder }),
  });

  if (!signRes.ok) {
    throw new Error("Could not initialize Cloudinary upload signature.");
  }

  const { signature, timestamp, cloudName, apiKey } = await signRes.json();

  // 2. Upload file directly to Cloudinary using resource_type = "auto"
  const formData = new FormData();
  formData.append("file", file);
  formData.append("api_key", apiKey);
  formData.append("timestamp", String(timestamp));
  formData.append("signature", signature);
  formData.append("folder", folder);

  const uploadRes = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
    {
      method: "POST",
      body: formData,
    }
  );

  const data = await uploadRes.json();

  if (!uploadRes.ok || data.error) {
    throw new Error(
      data?.error?.message || "Failed to upload file to Cloudinary."
    );
  }

  return {
    secureUrl: data.secure_url,
    publicId: data.public_id,
    resourceType: data.resource_type,
    format: data.format,
    bytes: data.bytes,
    originalFilename: data.original_filename || file.name,
    duration: data.duration,
  };
}

/**
 * Formats byte size into human-readable string (e.g., "4.2 MB", "850 KB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

