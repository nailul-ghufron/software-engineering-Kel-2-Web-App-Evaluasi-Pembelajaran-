import { FiTrash2 } from 'react-icons/fi';

/** Menampilkan grid nilai dengan kolom tugas dinamis dan validasi rentang 0–100 inline. */
export default function NilaiTable({
	mk,
	items,
	errors,
	onCellChange,
	onDeleteRow,
	sortState,
	onSortToggle,
}) {
	const n = mk?.jumlah_tugas || 0;
	function indicatorFor(key) {
		if (sortState?.key !== key || !sortState?.direction) return '';
		return sortState.direction === 'asc' ? ' ▲' : ' ▼';
	}

	const sortHeaderButtonStyle = {
		background: 'none',
		border: 'none',
		color: 'inherit',
		font: 'inherit',
		fontWeight: 700,
		padding: 0,
		cursor: 'pointer',
	};

	return (
		<div className="table-wrap">
			<table>
				<thead>
					<tr>
						<th>
							<button
								type="button"
								onClick={() => onSortToggle('nim')}
								style={sortHeaderButtonStyle}>
								NIM{indicatorFor('nim')}
							</button>
						</th>
						<th>
							<button
								type="button"
								onClick={() => onSortToggle('nama')}
								style={sortHeaderButtonStyle}>
								Nama{indicatorFor('nama')}
							</button>
						</th>
						{Array.from({ length: n }, (_, i) => (
							<th key={i}>Tugas {i + 1}</th>
						))}
						<th>UTS</th>
						<th>UAS</th>
						<th />
					</tr>
				</thead>
				<tbody>
					{items.map((row) => (
						<tr key={row.mahasiswa_id}>
							<td>{row.nim}</td>
							<td>{row.nama}</td>
							{Array.from({ length: n }, (_, ti) => {
								const keyT = `${row.mahasiswa_id}-t-${ti}`;
								const v = row.nilai_tugas[ti];
								return (
									<td key={ti}>
										<input
											className="nilai-input"
											type="number"
											min={0}
											max={100}
											step={0.01}
											value={v === null || v === undefined ? '' : v}
											onChange={(e) =>
												onCellChange(
													row.mahasiswa_id,
													'tugas',
													ti,
													e.target.value === '' ? '' : Number(e.target.value),
												)
											}
											style={{
												border: errors[keyT]
													? '1px solid var(--danger)'
													: '1px solid var(--outline)',
												background: 'var(--surface-low)',
												color: 'var(--text)',
											}}
										/>
										{errors[keyT] && (
											<div
												className="error-text"
												style={{ fontSize: '0.7rem' }}>
												{errors[keyT]}
											</div>
										)}
									</td>
								);
							})}
							<td>
								<input
									className="nilai-input"
									type="number"
									min={0}
									max={100}
									step={0.01}
									value={
										row.nilai_uts === null || row.nilai_uts === undefined
											? ''
											: row.nilai_uts
									}
									onChange={(e) =>
										onCellChange(
											row.mahasiswa_id,
											'uts',
											null,
											e.target.value === '' ? '' : Number(e.target.value),
										)
									}
									style={{
										border: errors[`${row.mahasiswa_id}-uts`]
											? '1px solid var(--danger)'
											: '1px solid var(--outline)',
										background: 'var(--surface-low)',
										color: 'var(--text)',
									}}
								/>
								{errors[`${row.mahasiswa_id}-uts`] && (
									<div
										className="error-text"
										style={{ fontSize: '0.7rem' }}>
										{errors[`${row.mahasiswa_id}-uts`]}
									</div>
								)}
							</td>
							<td>
								<input
									className="nilai-input"
									type="number"
									min={0}
									max={100}
									step={0.01}
									value={
										row.nilai_uas === null || row.nilai_uas === undefined
											? ''
											: row.nilai_uas
									}
									onChange={(e) =>
										onCellChange(
											row.mahasiswa_id,
											'uas',
											null,
											e.target.value === '' ? '' : Number(e.target.value),
										)
									}
									style={{
										border: errors[`${row.mahasiswa_id}-uas`]
											? '1px solid var(--danger)'
											: '1px solid var(--outline)',
										background: 'var(--surface-low)',
										color: 'var(--text)',
									}}
								/>
								{errors[`${row.mahasiswa_id}-uas`] && (
									<div
										className="error-text"
										style={{ fontSize: '0.7rem' }}>
										{errors[`${row.mahasiswa_id}-uas`]}
									</div>
								)}
							</td>
							<td>
								<button
									type="button"
									className="btn btn-danger"
									aria-label={`Hapus ${row.nama}`}
									title="Hapus mahasiswa"
									style={{
										display: 'inline-flex',
										alignItems: 'center',
										justifyContent: 'center',
										gap: '0.35rem',
									}}
									onClick={() => onDeleteRow(row.mahasiswa_id)}>
									<FiTrash2 />
								</button>
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}
