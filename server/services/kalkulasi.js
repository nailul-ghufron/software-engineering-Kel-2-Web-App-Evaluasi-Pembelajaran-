const BOBOT_TOLERANCE = 1e-6;

/** Memvalidasi total bobot tugas/UTS/UAS tepat 100% agar skoring tidak bias. */
export function validasiBobot(bobotTugas, bobotUts, bobotUas) {
  const total = Number(bobotTugas) + Number(bobotUts) + Number(bobotUas);
  if (Math.abs(total - 1) > BOBOT_TOLERANCE) {
    throw new Error("Total bobot harus 100%");
  }
}

/** Memastikan nilai numerik berada di rentang 0–100 untuk tugas, UTS, dan UAS. */
export function validasiRangeNilai(value, label = "Nilai") {
  if (value === null || value === undefined || value === "") return null;
  const num = Number(value);
  if (Number.isNaN(num) || num < 0 || num > 100) {
    throw new Error(`${label} harus berada di rentang 0-100`);
  }
  return num;
}

/** Menghitung rata-rata aritmetika tugas dan membulatkan dua desimal. */
export function hitungRataRataTugas(nilaiTugasArray) {
  if (!Array.isArray(nilaiTugasArray) || nilaiTugasArray.length === 0) return 0;
  const total = nilaiTugasArray.reduce((acc, v) => acc + Number(v || 0), 0);
  const rata = total / nilaiTugasArray.length;
  return Math.round(rata * 100) / 100;
}

/** Menggabungkan bobot dengan rata tugas/UTS/UAS lalu membatasi maksimal 100. */
export function hitungNilaiAkhir({
  bobotTugas,
  bobotUts,
  bobotUas,
  rataRataTugas,
  nilaiUts,
  nilaiUas,
}) {
  const raw =
    bobotTugas * Number(rataRataTugas || 0) +
    bobotUts * Number(nilaiUts || 0) +
    bobotUas * Number(nilaiUas || 0);
  const capped = Math.min(raw, 100);
  return Math.round(capped * 100) / 100;
}

/** Memetakan nilai numerik ke huruf sesuai pedoman akademik yang disepakati tim. */
export function konversiHuruf(nilaiAkhir) {
  const n = Number(nilaiAkhir);
  if (n >= 85) return "A";
  if (n >= 80) return "B+";
  if (n >= 75) return "B";
  if (n >= 70) return "C+";
  if (n >= 61) return "C";
  if (n >= 50) return "D";
  return "E";
}
