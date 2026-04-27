import { useState } from 'react'
import { supabase } from '../superbase-client'
import '../index.css'
import FormStep1 from './forms/FormStep1'
import FormStep2 from './forms/FormStep2'
import FormStep3 from './forms/FormStep3'
import FormStep4 from './forms/FormStep4'
import FormStep5 from './forms/FormStep5'
import FormStep6 from './forms/FormStep6'
import FormStep7 from './forms/FormStep7'
import FormStep8 from './forms/FormStep8'

const TOTAL_STEPS = 8

const emptyEntry = () => ({
  business_name: '', client_name: '',
  phone: '', email: '',
  street: '', city: '', state: '', postcode: '',
  facebook: '', twitter: '',
  github: '', instagram: '',
  linkedin: '', website: '',
  notes: '',
})

function Form({ setCurrentPage }) {
  const [step, setStep] = useState(1)
  const [error, setError] = useState(null)
  const [submitted, setSubmitted] = useState(false)
  const [entries, setEntries] = useState(Array.from({ length: TOTAL_STEPS }, emptyEntry))

  const update = (field, value) =>
    setEntries((prev) => prev.map((e, i) => i === step - 1 ? { ...e, [field]: value } : e))

  const next = () => setStep((s) => Math.min(s + 1, TOTAL_STEPS))
  const back = () => step > 1 ? setStep((s) => s - 1) : setCurrentPage('home')

  const handleSubmit = async () => {
    setError(null)
    const filled = entries.filter((e) => e.client_name || e.business_name)
    const toInsert = filled.length > 0 ? filled : [entries[0]]
    const { error } = await supabase.from('Users').insert(toInsert)
    if (error) setError(error.message)
    else setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center">
        <h2 style={{ color: '#6BC48E', fontSize: '1.8rem', marginBottom: '1rem' }}>Submitted!</h2>
        <p style={{ marginBottom: '1.5rem' }}>All entries have been saved successfully.</p>
        <button className="rocket-btn" onClick={() => setCurrentPage('home')}>Back to Home</button>
      </div>
    )
  }

  const stepComponents = [FormStep1, FormStep2, FormStep3, FormStep4, FormStep5, FormStep6, FormStep7, FormStep8]
  const StepComponent = stepComponents[step - 1]

  return (
    <div className="flex-1 overflow-hidden bg-gray-100 flex flex-col">

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto flex items-start justify-center px-6 py-6">
        <div className="w-full max-w-5xl bg-white p-8 rounded-2xl shadow-md">

          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <h1 style={{ fontSize: '1.3rem', fontWeight: 'bold', margin: 0, color: '#0E2240' }}>Create New Users</h1>
            <span style={{ color: '#6BC48E', fontWeight: 'bold' }}>Entry {step} / {TOTAL_STEPS}</span>
          </div>

          {/* Progress bar */}
          <div style={{ width: '100%', height: '6px', backgroundColor: '#e5e7eb', borderRadius: '4px', marginBottom: '1.5rem' }}>
            <div style={{ width: `${(step / TOTAL_STEPS) * 100}%`, height: '100%', backgroundColor: '#6BC48E', borderRadius: '4px', transition: 'width 0.3s' }} />
          </div>

          <StepComponent formData={entries[step - 1]} update={update} />
        </div>
      </div>

      {/* Fixed bottom buttons */}
      <div className="w-full max-w-5xl mx-auto flex justify-between items-center p-6">
        <button className="px-4 py-2 bg-white rounded-lg shadow hover:bg-gray-200 transition" onClick={back}>
          {step === 1 ? 'Cancel' : 'Back'}
        </button>
        {error && <span style={{ color: '#ff6b6b', fontSize: '0.85rem' }}>{error}</span>}
        {step < TOTAL_STEPS
          ? <button className="px-4 py-2 bg-green-500 text-white rounded-lg shadow hover:bg-green-600 transition" onClick={next}>Next</button>
          : <button className="px-4 py-2 bg-green-500 text-white rounded-lg shadow hover:bg-green-600 transition" onClick={handleSubmit}>Submit</button>
        }
      </div>

    </div>
  )
}

export default Form
