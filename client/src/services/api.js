import axios from "axios";

const configuredApiUrl = import.meta.env.VITE_API_URL && String(import.meta.env.VITE_API_URL).trim();
const isLocalhostApi =
  !!configuredApiUrl && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?(\/|$)/i.test(configuredApiUrl);
const baseURL = import.meta.env.PROD && isLocalhostApi ? "/api" : configuredApiUrl || "/api";
const api = axios.create({ baseURL });

/** Menyematkan JWT pada setiap permintaan REST dan menormalisasi respons 401 ke alur login. */
api.interceptors.request.use((config) => {
  const t = localStorage.getItem("token");
  if (t) {
    config.headers.Authorization = `Bearer ${t}`;
  }
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("token");
      if (!window.location.pathname.startsWith("/login")) {
        window.location.assign("/login");
      }
    }
    return Promise.reject(err);
  }
);

export async function login(body) {
  const { data } = await api.post("/auth/login", body);
  return data;
}

export async function fetchMataKuliah() {
  const { data } = await api.get("/matakuliah");
  return data;
}

export async function fetchDashboardSummary() {
  const { data } = await api.get("/matakuliah/dashboard/summary");
  return data;
}

export async function createMataKuliah(body) {
  const { data } = await api.post("/matakuliah", body);
  return data;
}

export async function updateMataKuliah(id, body) {
  const { data } = await api.put(`/matakuliah/${id}`, body);
  return data;
}

export async function deleteMataKuliah(id) {
  await api.delete(`/matakuliah/${id}`);
}

export async function fetchNilaiSet(id) {
  const { data } = await api.get(`/matakuliah/${id}/nilai`);
  return data;
}

export async function saveNilaiBatch(id, items) {
  const { data } = await api.post(`/matakuliah/${id}/nilai`, { items });
  return data;
}

export async function hitungSemua(id) {
  const { data } = await api.post(`/matakuliah/${id}/hitung`);
  return data;
}

export async function addMahasiswa(mkId, body) {
  const { data } = await api.post(`/matakuliah/${mkId}/mahasiswa`, body);
  return data;
}

export async function deleteMahasiswa(mhsId) {
  await api.delete(`/mahasiswa/${mhsId}`);
}

export async function downloadExcel(mkId, kodeMk) {
  const res = await api.get(`/matakuliah/${mkId}/export`, {
    responseType: "blob",
  });
  const cd = res.headers["content-disposition"];
  let name = `EvaluasiPembelajaran_${kodeMk}.xlsx`;
  if (cd && cd.includes("filename=")) {
    const m = cd.match(/filename="?([^";]+)"?/);
    if (m) name = m[1];
  }
  const url = window.URL.createObjectURL(res.data);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

export default api;
