import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { cancelJob, deleteJob, getJob, inspectPdf, startJob, type JobView } from '../api'
import { bySlug, type Tool } from '../tools'

type Item = { id: string; file: File; pages?: number | null; encrypted?: boolean; error?: string }
type Phase = 'idle' | 'uploading' | 'queued' | 'processing' | 'finalizing' | 'done' | 'failed'

const MAX_MB = 50
const fmtSize = (n: number) => (n > 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`)
const PHASE_LABEL: Record<Phase, string> = {
  idle: '', uploading: 'Uploading', queued: 'Queued', processing: 'Processing', finalizing: 'Finalizing', done: 'Completed', failed: 'Failed',
}

export default function ToolPage() {
  const { slug } = useParams()
  const tool = bySlug(slug)
  if (!tool) return <NotFound />
  return <ToolWorkspace key={tool.slug} tool={tool} />
}

function NotFound() {
  return (
    <main className="container narrow center">
      <h1>Tool not found</h1>
      <p>That tool does not exist. <Link to="/#tools">Browse all tools</Link>.</p>
    </main>
  )
}

function ToolWorkspace({ tool }: { tool: Tool }) {
  const [items, setItems] = useState<Item[]>([])
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(tool.fields.filter((f) => f.default !== undefined).map((f) => [f.key, f.default as string])),
  )
  const [phase, setPhase] = useState<Phase>('idle')
  const [uploadPct, setUploadPct] = useState(0)
  const [job, setJob] = useState<JobView | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [drag, setDrag] = useState(false)
  const dragIndex = useRef<number | null>(null)
  const input = useRef<HTMLInputElement>(null)
  const abort = useRef<(() => void) | null>(null)
  const cancelled = useRef(false)

  useEffect(() => {
    document.title = `${tool.name} Online – ZeroWaitPDF`
    const meta = document.querySelector('meta[name="description"]')
    meta?.setAttribute('content', tool.description)
  }, [tool])

  const accept = tool.accepts === 'pdf' ? '.pdf,application/pdf' : '.jpg,.jpeg,.png,image/jpeg,image/png'

  const addFiles = useCallback(
    async (list: FileList | File[]) => {
      const incoming = Array.from(list)
      const next: Item[] = []
      for (const file of incoming) {
        const id = `${file.name}-${file.size}-${Math.random().toString(36).slice(2, 8)}`
        const ext = file.name.toLowerCase().split('.').pop() ?? ''
        const okExt = tool.accepts === 'pdf' ? ext === 'pdf' : ['jpg', 'jpeg', 'png'].includes(ext)
        if (!okExt) next.push({ id, file, error: `Unsupported file type. Use ${tool.formats}.` })
        else if (file.size === 0) next.push({ id, file, error: 'This file is empty.' })
        else if (file.size > MAX_MB * 1048576) next.push({ id, file, error: `Larger than ${MAX_MB} MB.` })
        else next.push({ id, file })
      }
      const room = tool.multiple ? next : next.slice(0, 1)
      setItems((cur) => (tool.multiple ? [...cur, ...room] : room))
      setPhase('idle')
      setMessage(null)
      if (tool.accepts === 'pdf') {
        for (const it of room.filter((r) => !r.error)) {
          try {
            const info = await inspectPdf(it.file)
            setItems((cur) => cur.map((c) => (c.id === it.id ? { ...c, pages: info.pages, encrypted: info.encrypted } : c)))
          } catch (e) {
            setItems((cur) => cur.map((c) => (c.id === it.id ? { ...c, error: (e as Error).message } : c)))
          }
        }
      }
    },
    [tool],
  )

  const valid = items.filter((i) => !i.error)
  const missing = tool.fields.filter((f) => f.required && (!f.showIf || values[f.showIf.key] === f.showIf.value) && !(values[f.key] ?? '').trim())
  const canRun = valid.length >= tool.min && items.every((i) => !i.error) && missing.length === 0 && ['idle', 'failed'].includes(phase)
  const busy = ['uploading', 'queued', 'processing', 'finalizing'].includes(phase)

  const run = async () => {
    setMessage(null)
    setJob(null)
    cancelled.current = false
    setPhase('uploading')
    setUploadPct(0)
    const options: Record<string, string> = {}
    tool.fields.forEach((f) => {
      const visible = !f.showIf || values[f.showIf.key] === f.showIf.value
      if (visible && (values[f.key] ?? '') !== '') options[f.key] = values[f.key]
    })
    // Encrypted inputs need a password for non-security tools.
    if (items.some((i) => i.encrypted) && values.password) options.password = values.password
    try {
      const req = startJob(tool.slug, items.map((i) => i.file), options, setUploadPct)
      abort.current = req.abort
      let current = await req.promise
      abort.current = null
      setJob(current)
      while (!cancelled.current && !['completed', 'failed', 'cancelled'].includes(current.status)) {
        setPhase(current.status as Phase)
        await new Promise((r) => setTimeout(r, 400))
        current = await getJob(current.id)
        setJob(current)
      }
      if (current.status === 'completed') setPhase('done')
      else if (current.status === 'cancelled' || cancelled.current) { setPhase('idle'); setMessage('Cancelled.') }
      else { setPhase('failed'); setMessage(current.error ?? 'Processing failed.') }
    } catch (e) {
      if (!cancelled.current) { setPhase('failed'); setMessage((e as Error).message) }
      else setPhase('idle')
    }
  }

  const cancel = async () => {
    cancelled.current = true
    abort.current?.()
    if (job) await cancelJob(job.id)
    setPhase('idle')
    setMessage('Cancelled.')
  }

  const reset = async () => {
    if (job) await deleteJob(job.id)
    setItems([]); setJob(null); setPhase('idle'); setMessage(null)
  }

  const deleteNow = async () => {
    if (job) await deleteJob(job.id)
    setJob(null); setPhase('idle'); setMessage('Your processed file was deleted from our servers.')
  }

  const move = (from: number, to: number) =>
    setItems((cur) => { const n = [...cur]; const [m] = n.splice(from, 1); n.splice(to, 0, m); return n })

  const hasEncrypted = items.some((i) => i.encrypted) && tool.slug !== 'unlock'

  return (
    <main className="container narrow tool-page">
      <nav className="crumbs" aria-label="Breadcrumb"><Link to="/">Home</Link> / <span>{tool.name}</span></nav>
      <h1>{tool.name}</h1>
      <p className="lead">{tool.description}</p>

      {phase === 'done' && job?.result ? (
        <section className="panel done" aria-live="polite">
          <div className="check" aria-hidden>✓</div>
          <h2>Your file is ready</h2>
          <p className="muted">{job.result.filename} · {fmtSize(job.result.size)}{job.result.files > 1 ? ` · ${job.result.files} files in ZIP` : ''}</p>
          <div className="row center">
            <a className="btn primary lg" href={job.result.download_url} download={job.result.filename}>Download {job.result.mimetype === 'application/zip' ? 'ZIP' : job.result.mimetype.startsWith('image') ? 'image' : 'PDF'}</a>
          </div>
          <div className="row center gap">
            <button className="btn ghost" onClick={reset}>Process another file</button>
            <button className="btn ghost danger" onClick={deleteNow}>Delete processed file now</button>
          </div>
          <p className="fineprint">Files are removed automatically after one hour.</p>
        </section>
      ) : (
        <>
          {items.length === 0 ? (
            <div
              className={`drop ${drag ? 'over' : ''}`}
              onDragOver={(e) => { e.preventDefault(); setDrag(true) }}
              onDragLeave={() => setDrag(false)}
              onDrop={(e) => { e.preventDefault(); setDrag(false); addFiles(e.dataTransfer.files) }}
            >
              <div className="drop-icon" aria-hidden>⇪</div>
              <button className="btn primary lg" onClick={() => input.current?.click()}>Select {tool.accepts === 'pdf' ? 'PDF' : 'image'} file{tool.multiple ? 's' : ''}</button>
              <p className="muted">or drop {tool.multiple ? 'files' : 'a file'} here</p>
              <p className="fineprint">Supported: {tool.formats} · Max {MAX_MB} MB per file</p>
            </div>
          ) : (
            <section className="panel">
              <ul className="files" aria-label="Selected files">
                {items.map((it, i) => (
                  <li
                    key={it.id}
                    className={`file ${it.error ? 'bad' : ''}`}
                    draggable={tool.multiple && !busy}
                    onDragStart={() => (dragIndex.current = i)}
                    onDragOver={(e) => tool.multiple && e.preventDefault()}
                    onDrop={(e) => { e.preventDefault(); if (dragIndex.current !== null && dragIndex.current !== i) move(dragIndex.current, i); dragIndex.current = null }}
                  >
                    {tool.multiple && <span className="grip" aria-hidden title="Drag to reorder">⋮⋮</span>}
                    <span className="badge">{tool.accepts === 'pdf' ? 'PDF' : 'IMG'}</span>
                    <div className="meta">
                      <strong title={it.file.name}>{it.file.name}</strong>
                      <span className="muted">
                        {fmtSize(it.file.size)}
                        {it.pages ? ` · ${it.pages} page${it.pages > 1 ? 's' : ''}` : ''}
                        {it.encrypted ? ' · password protected' : ''}
                      </span>
                      {it.error && <span className="err">{it.error}</span>}
                    </div>
                    {tool.multiple && (
                      <span className="reorder">
                        <button aria-label={`Move ${it.file.name} up`} disabled={i === 0 || busy} onClick={() => move(i, i - 1)}>↑</button>
                        <button aria-label={`Move ${it.file.name} down`} disabled={i === items.length - 1 || busy} onClick={() => move(i, i + 1)}>↓</button>
                      </span>
                    )}
                    <button className="icon-btn" aria-label={`Remove ${it.file.name}`} disabled={busy} onClick={() => setItems((c) => c.filter((x) => x.id !== it.id))}>✕</button>
                  </li>
                ))}
              </ul>
              {tool.multiple && !busy && <button className="btn ghost" onClick={() => input.current?.click()}>+ Add more files</button>}

              {(tool.fields.length > 0 || hasEncrypted) && (
                <div className="options">
                  <h2>Options</h2>
                  <div className="grid-fields">
                    {tool.fields.filter((f) => !f.showIf || values[f.showIf.key] === f.showIf.value).map((f) => (
                      <label key={f.key} className="field">
                        <span>{f.label}{f.required && ' *'}</span>
                        {f.type === 'select' ? (
                          <select value={values[f.key] ?? ''} onChange={(e) => setValues({ ...values, [f.key]: e.target.value })} disabled={busy}>
                            {f.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                          </select>
                        ) : (
                          <input type={f.type} value={values[f.key] ?? ''} placeholder={f.placeholder} disabled={busy}
                            autoComplete={f.type === 'password' ? 'off' : undefined}
                            onChange={(e) => setValues({ ...values, [f.key]: e.target.value })} />
                        )}
                        {f.help && <small className="muted">{f.help}</small>}
                      </label>
                    ))}
                    {hasEncrypted && !tool.fields.some((f) => f.key === 'password') && (
                      <label className="field">
                        <span>Document password *</span>
                        <input type="password" autoComplete="off" value={values.password ?? ''} disabled={busy} onChange={(e) => setValues({ ...values, password: e.target.value })} />
                        <small className="muted">Needed to read the protected file you selected.</small>
                      </label>
                    )}
                  </div>
                </div>
              )}

              {busy && (
                <div className="status" role="status" aria-live="polite">
                  <div className="progress"><div style={{ width: `${phase === 'uploading' ? Math.round(uploadPct * 0.2) : job?.progress ?? 20}%` }} /></div>
                  <span>{PHASE_LABEL[phase]}{phase === 'uploading' ? ` ${uploadPct}%` : '…'}</span>
                </div>
              )}
              {message && <p className={phase === 'failed' ? 'err block' : 'muted'} role="alert">{message}</p>}

              <div className="row end gap">
                {busy ? (
                  <button className="btn ghost" onClick={cancel}>Cancel</button>
                ) : (
                  <button className="btn ghost" onClick={reset}>Clear</button>
                )}
                <button className="btn primary lg" disabled={!canRun} onClick={run}>{busy ? 'Working…' : tool.action}</button>
              </div>
              {tool.min > 1 && valid.length < tool.min && <p className="fineprint">Add at least {tool.min} files to continue.</p>}
            </section>
          )}
        </>
      )}
      {phase === 'idle' && message && items.length === 0 && <p className="muted center" role="status">{message}</p>}
      <input ref={input} type="file" hidden multiple={tool.multiple} accept={accept} onChange={(e) => { if (e.target.files) addFiles(e.target.files); e.target.value = '' }} />
    </main>
  )
}
