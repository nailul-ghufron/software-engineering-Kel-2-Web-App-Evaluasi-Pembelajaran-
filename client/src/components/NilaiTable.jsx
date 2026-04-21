/** Menampilkan grid nilai dengan kolom tugas dinamis dan validasi rentang 0–100 inline. */
export default function NilaiTable({ mk, items, errors, onCellChange, onDeleteRow }) {
  const n = mk?.jumlah_tugas || 0;
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>NIM</th>
            <th>Nama</th>
            {Array.from({ length: n }, (_, i) => (
              <th key={i}>Tugas {i + 1}</th>
            ))}
            <th>UTS</th>
            <th>UAS</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {items.map((row, ri) => (
            <tr key={row.mahasiswa_id}>
              <td>{row.nim}</td>
              <td>{row.nama}</td>
              {Array.from({ length: n }, (_, ti) => {
                const keyT = `${ri}-t-${ti}`;
                const v = row.nilai_tugas[ti];
                return (
                  <td key={ti}>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      step={0.01}
                      value={v === null || v === undefined ? "" : v}
                      onChange={(e) =>
                        onCellChange(ri, "tugas", ti, e.target.value === "" ? "" : Number(e.target.value))
                      }
                      style={{
                        width: 88,
                        padding: "0.52rem 0.55rem",
                        borderRadius: 10,
                        border: errors[keyT] ? "1px solid var(--danger)" : "1px solid var(--outline)",
                        background: "var(--surface-low)",
                        color: "var(--text)",
                      }}
                    />
                    {errors[keyT] && (
                      <div className="error-text" style={{ fontSize: "0.7rem" }}>
                        {errors[keyT]}
                      </div>
                    )}
                  </td>
                );
              })}
              <td>
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={0.01}
                  value={
                    row.nilai_uts === null || row.nilai_uts === undefined ? "" : row.nilai_uts
                  }
                  onChange={(e) =>
                    onCellChange(
                      ri,
                      "uts",
                      null,
                      e.target.value === "" ? "" : Number(e.target.value)
                    )
                  }
                  style={{
                    width: 88,
                    padding: "0.52rem 0.55rem",
                    borderRadius: 10,
                    border: errors[`${ri}-uts`]
                      ? "1px solid var(--danger)"
                      : "1px solid var(--outline)",
                    background: "var(--surface-low)",
                    color: "var(--text)",
                  }}
                />
                {errors[`${ri}-uts`] && (
                  <div className="error-text" style={{ fontSize: "0.7rem" }}>
                    {errors[`${ri}-uts`]}
                  </div>
                )}
              </td>
              <td>
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={0.01}
                  value={
                    row.nilai_uas === null || row.nilai_uas === undefined ? "" : row.nilai_uas
                  }
                  onChange={(e) =>
                    onCellChange(
                      ri,
                      "uas",
                      null,
                      e.target.value === "" ? "" : Number(e.target.value)
                    )
                  }
                  style={{
                    width: 88,
                    padding: "0.52rem 0.55rem",
                    borderRadius: 10,
                    border: errors[`${ri}-uas`]
                      ? "1px solid var(--danger)"
                      : "1px solid var(--outline)",
                    background: "var(--surface-low)",
                    color: "var(--text)",
                  }}
                />
                {errors[`${ri}-uas`] && (
                  <div className="error-text" style={{ fontSize: "0.7rem" }}>
                    {errors[`${ri}-uas`]}
                  </div>
                )}
              </td>
              <td>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => onDeleteRow(row.mahasiswa_id)}
                >
                  Hapus
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
