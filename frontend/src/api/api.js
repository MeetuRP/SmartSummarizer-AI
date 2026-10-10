import axios from "axios";

const apiBaseUrl = new URL(import.meta.env.VITE_API_URL || "http://127.0.0.1:8001");
if (!["127.0.0.1", "localhost", "[::1]"].includes(apiBaseUrl.hostname)) {
  throw new Error("VITE_API_URL must point to a local loopback backend. Remote API endpoints are disabled.");
}

const api = axios.create({
  baseURL: apiBaseUrl.toString(),
  timeout: 300000,
});

export async function uploadDocument(file, onProgress) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await api.post("/upload", formData, {
    // Local CPU inference may take longer than a fixed browser timeout.
    timeout: 0,
    onUploadProgress: (event) => {
      if (event.total && onProgress) {
        onProgress(Math.min(100, Math.round((event.loaded / event.total) * 100)));
      }
    },
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
}

export async function getHistory() {
  const response = await api.get("/history");
  return response.data;
}

export async function getSummary(id) {
  const response = await api.get(`/summary/${id}`);
  return response.data;
}

export default api;


