import { AllCommunityModule } from 'ag-grid-community'
import { AgGridProvider, AgGridReact } from 'ag-grid-react'
import { useState, useEffect } from 'react'
import { supabase } from '../supabase-client'

const modules = [AllCommunityModule]

function StudioLinkCell(params) {
  if (!params.value) return <span style={{ color: '#aaa' }}>Not available</span>
  return (
    
    <a
      href={params.value}
      target="_blank"
      rel="noopener noreferrer"
      style={{ color: '#6BC48E', fontWeight: 'bold', textDecoration: 'underline' }}
    >
      Open Studio
    </a>
  )
}

function Home({ setCurrentPage }) {
  const [rowData, setRowData] = useState([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState(null)

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      setFetchError(null)

      const { data, error } = await supabase
        .from('Users')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        setFetchError('Failed to load users: ' + error.message)
      } else {
        setRowData(data)
      }

      setLoading(false)
    }

    fetchData()
  }, [])

  const colDefs = [
    { field: 'Business_name', headerName: 'Business Name', flex: 1 },
    { field: 'Client_name',   headerName: 'Client Name',   flex: 1 },
    { field: 'email',         headerName: 'Email',         flex: 1 },
    { field: 'studio_url',    headerName: 'Studio URL',    flex: 1, cellRenderer: StudioLinkCell },
  ]

  return (
    <AgGridProvider modules={modules}>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '2rem', boxSizing: 'border-box' }}>

        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">User List</h1>
          <button
            onClick={() => setCurrentPage('register')}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#6BC48E',
              color: '#0E2240',
              border: 'none',
              borderRadius: '4px',
              fontWeight: 'bold',
              cursor: 'pointer',
            }}
          >
            + Create New Client
          </button>
        </div>

        {fetchError && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            ⚠️ {fetchError}
          </div>
        )}

        {loading ? (
          <div className="flex flex-1 items-center justify-center text-gray-400 text-sm">
            Loading clients…
          </div>
        ) : (
          <div style={{ flex: 1 }}>
            <AgGridReact
              rowData={rowData}
              columnDefs={colDefs}
              overlayNoRowsTemplate="<span style='color: #888'>No clients yet. Create one to get started.</span>"
            />
          </div>
        )}

      </div>
    </AgGridProvider>
  )
}

export default Home