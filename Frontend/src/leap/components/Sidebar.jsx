import { PARTY_SHORT } from '../data.js'

export default function Sidebar() {
  return (
    <aside className="leap-sidebar">
      <div className="leap-sidebar-brand">
        <span className="leap-brand-mark">{PARTY_SHORT}</span>
        <div>
          <div className="leap-brand-title">Telugu Desam Party</div>
        </div>
      </div>

      <nav className="leap-nav">
        <button type="button" className="leap-nav-btn active">Local Body Elections</button>
      </nav>

      <div className="leap-sidebar-footer">
        <span className="leap-avatar">U</span>
        <span className="leap-sidebar-footer-dash">—</span>
      </div>
    </aside>
  )
}
