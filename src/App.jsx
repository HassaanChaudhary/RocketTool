

import React, { useState, useEffect } from 'react'
import { supabase } from './superbase-client'
import Auth from './pages/Auth'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Form from './pages/Form'
import RegisterForm from './pages/RegisterForm'

function App() {
  const [session, setSession] = useState(null)
  const [currentPage, setCurrentPage] = useState('home')

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  if (!session) {
    return <Auth />
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Navbar currentPage={currentPage} setCurrentPage={setCurrentPage} />
      {currentPage === 'home' && <Home setCurrentPage={setCurrentPage} />}
      {currentPage === 'form' && <Form setCurrentPage={setCurrentPage} />}
      {currentPage === 'register' && (
        <div className="flex-1 overflow-y-auto bg-gray-50 p-6">
          <RegisterForm onSubmit={async (data) => {
  const { profilePicture, ...payload } = data
  console.log('Submitting payload:', payload)
  const res = await fetch('https://n8n.178.104.148.252.nip.io/webhook/provision-client', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ client_name: payload.username }),
  })
  if (!res.ok) throw new Error('Webhook failed')
  setCurrentPage('home')
}} />
        </div>
      )}
    </div>
  )
}

export default App
