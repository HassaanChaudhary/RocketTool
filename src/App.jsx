import { useState, useEffect } from "react"
import Auth from "./pages/Auth"
import Home from "./pages/Home"
import Form from "./pages/Form"
import RegisterForm from "./pages/RegisterForm"
import Navbar from "./components/Navbar"
import { supabase } from "./supabase-client"

function App() {
  const [session, setSession] = useState(null)
  const [currentPage, setCurrentPage] = useState('home')
  const [submitError, setSubmitError] = useState(null)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  async function handleRegister(data) {
    setSubmitError(null)
    setSubmitSuccess(false)

    try {
      // 1. Hit the n8n webhook to provision the Supabase instance
      const res = await fetch('https://n8n.178.104.148.252.nip.io/webhook/provision-client', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_name: data.username }),
      })

      if (!res.ok) throw new Error('Provisioning webhook failed.')

      // 2. Parse the Studio URL from the webhook response
      const resData = await res.json()
      const stdout = resData.stdout || ''
      const match = stdout.match(/Studio URL:\s*(http:\/\/[^\s\\]+)/)
      const studioUrl = match ? match[1] : null

      // 3. Insert into Supabase Users table including the studio URL
      const { error: insertError } = await supabase.from('Users').insert({
        Business_name: data.username,
        Client_name: data.firstName + ' ' + data.lastName,
        email: data.email,
        studio_url: studioUrl,
      })

      if (insertError) throw new Error('Failed to save user: ' + insertError.message)

      // 4. Success
      setSubmitSuccess(true)
      setTimeout(() => {
        setSubmitSuccess(false)
        setCurrentPage('home')
      }, 1500)

    } catch (err) {
      setSubmitError(err.message)
    }
  }

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
          <RegisterForm
            onSubmit={handleRegister}
            error={submitError}
            success={submitSuccess}
          />
        </div>
      )}
    </div>
  )
}

export default App