import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { TOOLS, CATEGORY_LABEL, type Category } from '../tools'

export function Logo({ dark = false }: { dark?: boolean }) {
  return (
    <Link to="/" className="logo" aria-label="ZeroWaitPDF home">
      <img src={`/brand/logo-horizontal${dark ? '-dark' : ''}.svg`} alt="ZeroWaitPDF" height={36} />
    </Link>
  )
}

function Dropdown({ label, children }: { label: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const loc = useLocation()
  useEffect(() => setOpen(false), [loc])
  useEffect(() => {
    const close = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false) }
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', esc)
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', esc) }
  }, [])
  return (
    <div className="dropdown" ref={ref}>
      <button className="navlink" aria-expanded={open} aria-haspopup="true" onClick={() => setOpen(!open)}>{label} <span aria-hidden>▾</span></button>
      {open && <div className="menu">{children}</div>}
    </div>
  )
}

export default function Header() {
  const [mobile, setMobile] = useState(false)
  const loc = useLocation()
  useEffect(() => setMobile(false), [loc])
  const convert = TOOLS.filter((t) => t.category === 'convert')
  const cats = Object.keys(CATEGORY_LABEL) as Category[]

  return (
    <header className="site-header">
      <div className="container bar">
        <Logo />
        <nav className="desktop-nav" aria-label="Main">
          <NavLink className="navlink" to="/tools/merge">Merge PDF</NavLink>
          <NavLink className="navlink" to="/tools/split">Split PDF</NavLink>
          <NavLink className="navlink" to="/tools/compress">Compress PDF</NavLink>
          <Dropdown label="Convert PDF">
            {convert.map((t) => <NavLink key={t.slug} to={`/tools/${t.slug}`}>{t.name}</NavLink>)}
          </Dropdown>
          <Dropdown label="All PDF Tools">
            <div className="mega">
              {cats.map((c) => (
                <div key={c}>
                  <h3>{CATEGORY_LABEL[c]}</h3>
                  {TOOLS.filter((t) => t.category === c).map((t) => <NavLink key={t.slug} to={`/tools/${t.slug}`}>{t.name}</NavLink>)}
                </div>
              ))}
            </div>
          </Dropdown>
        </nav>
        <button className="hamburger" aria-label="Menu" aria-expanded={mobile} onClick={() => setMobile(!mobile)}>{mobile ? '✕' : '☰'}</button>
      </div>
      {mobile && (
        <nav className="mobile-nav" aria-label="Mobile">
          {TOOLS.map((t) => <NavLink key={t.slug} to={`/tools/${t.slug}`}>{t.name}</NavLink>)}
        </nav>
      )}
    </header>
  )
}
