import { useMemo, useState } from "react"

export type KpiRow = {
  id: string
  title: string
  meta: string
  value?: string
}

type Props = {
  title: string
  subtitle?: string
  rows: KpiRow[]
  onClose: () => void
  onDelete: (ids: string[]) => void | Promise<unknown>
}

export function KpiModal({ title, subtitle, rows, onClose, onDelete }: Props) {
  const [selected, setSelected] = useState<Record<string, boolean>>({})
  const [busy, setBusy] = useState(false)
  const ids = useMemo(() => Object.keys(selected).filter((id) => selected[id]), [selected])

  async function remove(targets: string[]) {
    if (!targets.length || busy) return
    setBusy(true)
    try {
      await onDelete(targets)
      setSelected({})
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="sheet-root" role="dialog" aria-modal="true" aria-labelledby="kpi-titulo">
      <button className="sheet-backdrop" type="button" aria-label="Fechar" onClick={onClose} />
      <div className="sheet kpi-sheet">
        <h2 id="kpi-titulo">{title}</h2>
        {subtitle && <p className="fine">{subtitle}</p>}
        {rows.length === 0 ? (
          <p className="fine">Nada neste KPI ainda.</p>
        ) : (
          <ul className="kpi-list">
            {rows.map((row) => (
              <li key={row.id}>
                <label>
                  <input
                    type="checkbox"
                    checked={Boolean(selected[row.id])}
                    onChange={(event) => setSelected((prev) => ({ ...prev, [row.id]: event.target.checked }))}
                  />
                  <span>
                    <strong>{row.title}</strong>
                    <small>{row.meta}</small>
                  </span>
                  {row.value && <em>{row.value}</em>}
                </label>
                <button
                  className="ghost slim danger-text"
                  type="button"
                  disabled={busy}
                  onClick={() => void remove([row.id])}
                >
                  Excluir
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="kpi-actions">
          <button className="ghost" type="button" onClick={onClose}>Fechar</button>
          <button
            className="danger"
            type="button"
            disabled={!ids.length || busy}
            onClick={() => void remove(ids)}
          >
            {busy ? "Excluindo…" : `Excluir selecionados (${ids.length})`}
          </button>
        </div>
      </div>
    </div>
  )
}
