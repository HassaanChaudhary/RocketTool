import { useState } from 'react'
import { supabase } from '../superbase-client'

function Navbar({ currentPage, setCurrentPage }) {
  const [logoHovered, setLogoHovered] = useState(false)

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  const linkStyle = (page) => ({
    cursor: 'pointer',
    padding: '0.5rem 1rem',
    borderRadius: '4px',
    color: '#F2F2F2',
    fontWeight: currentPage === page ? 'bold' : 'normal',
    textDecoration: currentPage === page ? 'underline' : 'none',
  })

  return (
    <nav style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '1rem 2rem', backgroundColor: '#0E2240', color: '#F2F2F2' }}>
      <span
        onClick={() => setCurrentPage('home')}
        onMouseEnter={() => setLogoHovered(true)}
        onMouseLeave={() => setLogoHovered(false)}
        style={{ color: logoHovered ? '#4a9e6e' : '#6BC48E', fontWeight: 'bold', fontSize: '1.2rem', marginRight: '1rem', cursor: 'pointer', transition: 'color 0.2s' }}
      >RocketVan</span>
      <button onClick={handleLogout} style={{ marginLeft: 'auto', padding: '0.4rem 1rem', backgroundColor: '#6BC48E', color: '#0E2240', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>
        Log Out
      </button>
    </nav>
  )
}

export default Navbar
