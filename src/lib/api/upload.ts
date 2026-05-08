import { apiRequest } from "./client";

export async function uploadFile(file: File, folder: string = "forms") {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("folder", folder);

  return apiRequest<{ url: string; key: string }>("/s3/upload", {
    method: "POST",
    body: formData,
  });
}

export async function uploadVideo(file: File, folder: string = "videos") {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("folder", folder);

  return apiRequest<{ url: string; key: string }>("/s3/upload-video", {
    method: "POST",
    body: formData,
  });
}
