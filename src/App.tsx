import { Link, Route, Routes } from 'react-router-dom'
import Header, { Logo } from './components/Header'
import Home from './pages/Home'
import ToolPage from './pages/ToolPage'
import { TOOLS } from './tools'

function Footer() {
  return (
    <footer className="site-footer">
      <div className="container foot">
        <div><Logo dark /><p className="muted">Your PDFs. Processed without the wait.</p></div>
        <div><h4>Organize</h4>{TOOLS.filter((t) => t.category === 'organize').slice(0, 5).map((t) => <Link key={t.slug} to={`/tools/${t.slug}`}>{t.name}</Link>)}</div>
        <div><h4>Convert</h4>{TOOLS.filter((t) => t.category === 'convert').map((t) => <Link key={t.slug} to={`/tools/${t.slug}`}>{t.name}</Link>)}</div>
        <div><h4>Edit &amp; secure</h4>{TOOLS.filter((t) => ['edit', 'security'].includes(t.category)).map((t) => <Link key={t.slug} to={`/tools/${t.slug}`}>{t.name}</Link>)}</div>
      </div>
      <div className="container fineprint center">© {new Date().getFullYear()} ZeroWaitPDF. Files are deleted automatically one hour after processing.</div>
    </footer>
  )
}

export default function App() {
  return (
    <>
      <a className="skip" href="#main">Skip to content</a>
      <Header />
      <div id="main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/tools/:slug" element={<ToolPage />} />
          <Route path="*" element={<main className="container narrow center"><h1>Page not found</h1><p><Link to="/">Go home</Link></p></main>} />
        </Routes>
      </div>
      <Footer />
    </>
  )
}
