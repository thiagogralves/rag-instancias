type Props = {
  title: string
  url: string
  onClose: () => void
}

export function WikiModal({ title, url, onClose }: Props) {
  return (
    <div className="sheet-root wiki-root" role="dialog" aria-modal="true" aria-label={title}>
      <button className="sheet-backdrop" type="button" aria-label="Fechar" onClick={onClose} />
      <div className="wiki-modal">
        <header className="wiki-bar">
          <div>
            <strong>{title}</strong>
            <p>bROWiki</p>
          </div>
          <div className="wiki-actions">
            <a href={url} target="_blank" rel="noreferrer" className="ghost">Abrir fora</a>
            <button className="primary slim" type="button" onClick={onClose}>Fechar</button>
          </div>
        </header>
        <iframe title={title} src={url} className="wiki-frame" loading="lazy" referrerPolicy="no-referrer" />
      </div>
    </div>
  )
}
