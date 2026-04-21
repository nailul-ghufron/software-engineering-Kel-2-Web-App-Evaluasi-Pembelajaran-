/** Memicu unduhan blob Excel dengan penamaan file dari header respons. */
export default function ExportButton({ loading, onClick, label = "Ekspor ke Excel" }) {
  return (
    <button type="button" className="btn btn-primary" disabled={loading} onClick={onClick}>
      {loading ? "Menyiapkan…" : label}
    </button>
  );
}
