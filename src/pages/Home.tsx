import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { CATEGORY_LABEL, TOOLS, searchTools, type Category } from '../tools'

const FILTERS: { key: Category | 'all'; label: string }[] = [
  { key: 'all', label: 'All Tools' },
  { key: 'organize', label: CATEGORY_LABEL.organize },
  { key: 'convert', label: CATEGORY_LABEL.convert },
  { key: 'edit', label: CATEGORY_LABEL.edit },
  { key: 'security', label: CATEGORY_LABEL.security },
]

const FAQ = [
  ['Which files can I upload?', 'PDF files for most tools, and JPG or PNG images for the image-to-PDF tools. Files are checked by their actual content, not just the file extension.'],
  ['Is there a file size limit?', 'Yes. Each file can be up to 50 MB. Files that are too large are rejected before processing starts.'],
  ['How is my data handled?', 'Files are processed on the server and stored only temporarily. They are deleted automatically one hour after processing, or immediately when you choose Delete.'],
  ['Can you unlock a PDF if I forgot the password?', 'No. Unlock PDF removes protection only when you provide the correct password. It does not guess or crack passwords.'],
  ['How fast is processing?', 'Most operations finish in seconds, but speed depends on file size and the tool. The progress indicator shows the real state of your job: uploading, queued, processing, finalizing, then completed.'],
  ['Why do I see a ZIP file?', 'Tools that produce several files, such as Split PDF or PDF to JPG, deliver them together as one ZIP.'],
]

export default function Home() {
  const [q, setQ] = useState('')
  const [cat, setCat] = useState<Category | 'all'>('all')
  const [openFaq, setOpenFaq] = useState<number | null>(0)
  const nav = useNavigate()
  const loc = useLocation()
  const results = useMemo(() => searchTools(q, cat), [q, cat])

  useEffect(() => {
    document.title = 'ZeroWaitPDF – Every PDF Tool You Need, All in One Place'
    if (loc.hash === '#tools') document.getElementById('tools')?.scrollIntoView()
  }, [loc.hash])

  return (
    <main>
      <section className="hero">
        <div className="container hero-grid">
          <div>
            <p className="eyebrow">Your PDFs. Processed without the wait.</p>
            <h1>Every PDF Tool You Need, All in One Place.</h1>
            <p className="lead">Merge, split, compress, rotate, protect and convert your PDF documents with fast, simple online tools. Real processing with honest progress, no unnecessary waiting.</p>
            <div className="row gap wrap">
              <a className="btn primary lg" href="#tools">Explore All Tools</a>
              <Link className="btn ghost lg" to="/tools/merge">Try Merge PDF</Link>
            </div>
            <ul className="trust">
              <li>✓ Content-checked uploads</li>
              <li>✓ AES-256 password protection</li>
              <li>✓ Files auto-deleted after 1 hour</li>
            </ul>
          </div>
          <div className="hero-art" aria-hidden>
            <div className="sheet s1"><i /><i /><i className="short" /></div>
            <div className="sheet s2"><i /><i /><i className="short" /></div>
            <div className="sheet s3"><span>PDF</span><i /><i /><i className="short" /></div>
          </div>
        </div>
        <div className="container">
          <div
            className="drop hero-drop"
            role="button" tabIndex={0}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault()
              const files = Array.from(e.dataTransfer.files)
              nav(files.length > 1 ? '/tools/merge' : '/tools/compress')
            }}
            onClick={() => nav('/tools/merge')}
            onKeyDown={(e) => e.key === 'Enter' && nav('/tools/merge')}
          >
            <strong>Start with a PDF</strong>
            <span className="muted">Choose a tool below, or open Merge PDF to begin right away.</span>
          </div>
        </div>
      </section>

      <section id="tools" className="container section">
        <h2 className="center">All the PDF tools</h2>
        <p className="center muted">{TOOLS.length} working tools. Each one runs on our processing backend.</p>
        <div className="toolbar">
          <input type="search" aria-label="Search tools" placeholder="Search tools, e.g. “combine”, “password”, “image”" value={q} onChange={(e) => setQ(e.target.value)} />
          <div className="chips" role="tablist" aria-label="Tool categories">
            {FILTERS.map((f) => (
              <button key={f.key} role="tab" aria-selected={cat === f.key} className={`chip ${cat === f.key ? 'on' : ''}`} onClick={() => setCat(f.key)}>{f.label}</button>
            ))}
          </div>
        </div>
        {results.length === 0 ? (
          <p className="center muted">No tools match “{q}”. Try a different word.</p>
        ) : (
          <div className="tool-grid">
            {results.map((t) => (
              <Link key={t.slug} to={`/tools/${t.slug}`} className="card">
                <span className="ticon" aria-hidden>{t.icon}</span>
                <h3>{t.name}</h3>
                <p>{t.blurb}</p>
                <span className="fmt">{t.formats}</span>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="section alt">
        <div className="container">
          <h2 className="center">Work your way</h2>
          <div className="three">
            <article className="feature"><h3>Work anywhere</h3><p>Process documents straight from your browser on desktop or mobile. Nothing to install.</p></article>
            <article className="feature"><h3>Honest progress</h3><p>You see the real job state, from uploading to completed. A result appears only after the server confirms it.</p></article>
            <article className="feature"><h3>Private by design</h3><p>Uploads are validated by content, processed in isolated temporary storage and automatically deleted after an hour.</p></article>
          </div>
        </div>
      </section>

      <section className="container section narrow" id="faq">
        <h2 className="center">Frequently asked questions</h2>
        {FAQ.map(([question, answer], i) => (
          <div key={question} className="faq">
            <button aria-expanded={openFaq === i} onClick={() => setOpenFaq(openFaq === i ? null : i)}>{question}<span aria-hidden>{openFaq === i ? '−' : '+'}</span></button>
            {openFaq === i && <p>{answer}</p>}
          </div>
        ))}
      </section>
    </main>
  )
}
