import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import Moodfit from './Moodfit.jsx'


createRoot(document.getElementById('root')).render(

  <StrictMode>

    <Moodfit />

  </StrictMode>
)
