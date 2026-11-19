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
  onDelete: (ids: string[]) => void
}

export function KpiModal({ title, subtitle, rows, onClose, onDelete }: Props) {
  const [selected, setSelected] = useState<Record<string, boolean>>({})
  const ids = useMemo(() => Object.keys(selected).filter((id) => selected[id]), [selected])

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
              </li>
            ))}
          </ul>
        )}
        <div className="kpi-actions">
          <button className="ghost" type="button" onClick={onClose}>Fechar</button>
          <button
            className="danger"
            type="button"
            disabled={!ids.length}
            onClick={() => {
              onDelete(ids)
              setSelected({})
            }}
          >
            Excluir selecionados ({ids.length})
          </button>
        </div>
      </div>
    </div>
  )
}
