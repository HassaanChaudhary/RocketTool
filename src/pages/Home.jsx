import { AllCommunityModule } from 'ag-grid-community'
import { AgGridProvider, AgGridReact } from 'ag-grid-react'
import { useState, useEffect } from 'react'
import { supabase } from '../superbase-client'
import '../index.css'

const modules = [AllCommunityModule]


function Home({ setCurrentPage }) {
    // getting the data from Supabase
  useEffect(() => {
    const fetchData = async () => {
      const { data, error } = await supabase
        .from("Users")
        .select("*")
        .order("created_at", { ascending: false })

      console.log("Fetched data:", data)  
      if (error) {
        console.error("Error fetching data:", error)
      } else {
        setData(data)
      }
    }

    fetchData()
  }, [])

  const [rowData, setData] = useState([
    { id: "1", Business_name: "Loading...", Client_name: "Loading...", email: "Loading..." },
  ])

  const [colDefs] = useState([
    { field: "Business_name", flex: 1 },
    { field: "Client_name", flex: 1 },
    { field: "email", flex: 1 },
    {
      headerName: "",
      width: 120,
      cellRenderer: () => (
        // className="rocket-btn" does not work for now
        // TODO: make this button look better and add functionality to it. it should take the user to a page with more details about the task and the client
        <button className="rocket-btn" style={{ padding: '0.0rem 0.5rem', backgroundColor: 'white', color: '#6BC48E', border: '0px solid #6BC48E', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>
          Details
        </button>
      ),
    },
  ])

  return (
    <AgGridProvider modules={modules}>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '2rem', boxSizing: 'border-box'}}>
        <div className='flex items-center justify-between mb-4'>
            <h1 className='text-2xl font-bold'>User List</h1>
            <button onClick={() => setCurrentPage('register')} style={{ padding: '0.5rem 1rem', backgroundColor: '#6BC48E', color: '#0E2240', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>Create a new User</button>
        </div>
        <div style={{ flex: 1 }}>
          <AgGridReact rowData={rowData} columnDefs={colDefs} />
        </div>
      </div>
    </AgGridProvider>
  )
}

export default Home
