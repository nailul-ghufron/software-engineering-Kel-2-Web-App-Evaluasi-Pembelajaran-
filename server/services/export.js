import ExcelJS from "exceljs";

const HEADER_FILL_COLOR = "FFD3D1C7";

/** Membangun workbook Excel sesuai kolom resmi laporan evaluasi pembelajaran. */
export async function generateWorkbook({ mataKuliah, rows }) {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Web App Evaluasi Pembelajaran";
  wb.created = new Date();

  const sheet = wb.addWorksheet(mataKuliah.kode_mk);
  const tanggal = new Date().toISOString().slice(0, 10);

  sheet.addRow([
    `Nama MK: ${mataKuliah.nama_mk}`,
    `Kode MK: ${mataKuliah.kode_mk}`,
    `Tanggal Ekspor: ${tanggal}`,
  ]);
  sheet.addRow([]);

  const headerRow = sheet.addRow([
    "Kode MK",
    "NIM",
    "Nama Mahasiswa",
    "Nilai Tugas",
    "Prosentase Nilai Tugas",
    "Nilai UTS",
    "Prosentase Nilai UTS",
    "Nilai UAS",
    "Prosentase Nilai UAS",
    "Nilai Akhir",
    "Nilai Huruf",
  ]);
  headerRow.eachCell((cell) => {
    cell.font = { bold: true };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: HEADER_FILL_COLOR },
    };
    cell.alignment = { vertical: "middle", horizontal: "center" };
    cell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
  });

  const pctTugas = Math.round(mataKuliah.bobot_tugas * 100);
  const pctUts = Math.round(mataKuliah.bobot_uts * 100);
  const pctUas = Math.round(mataKuliah.bobot_uas * 100);

  rows.forEach((r) => {
    sheet.addRow([
      mataKuliah.kode_mk,
      r.nim,
      r.nama,
      r.rata_rata_tugas ?? 0,
      `${pctTugas}%`,
      r.nilai_uts ?? 0,
      `${pctUts}%`,
      r.nilai_uas ?? 0,
      `${pctUas}%`,
      r.nilai_akhir ?? 0,
      r.nilai_huruf ?? "",
    ]);
  });

  [4, 6, 8, 10].forEach((colIdx) => {
    sheet.getColumn(colIdx).numFmt = "0.00";
  });

  sheet.columns.forEach((col) => {
    let maxLen = 10;
    col.eachCell({ includeEmpty: false }, (cell) => {
      const val = cell.value == null ? "" : String(cell.value);
      if (val.length > maxLen) maxLen = val.length;
    });
    col.width = Math.min(maxLen + 2, 40);
  });

  return wb.xlsx.writeBuffer();
}

/** Menghasilkan nama file unduhan agar konsisten dengan kebijakan penyimpanan arsip. */
export function buildFilename(kodeMk) {
  const ymd = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  return `EvaluasiPembelajaran_${kodeMk}_${ymd}.xlsx`;
}
