import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://127.0.0.1:8001",
  timeout: 300000,
});

export async function uploadDocument(file) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await api.post("/upload", formData, {
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


