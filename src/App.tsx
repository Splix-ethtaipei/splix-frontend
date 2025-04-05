import { createAppKit, useAppKitAccount } from '@reown/appkit/react'

import { WagmiProvider } from 'wagmi'
import { useState } from 'react'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ActionButtonList } from './components/ActionButtonList'
import { SmartContractActionButtonList } from './components/SmartContractActionButtonList'
import { projectId, metadata, networks, wagmiAdapter } from './config'

import "./App.css"
import ItemList from './components/ItemList/ItemList'
import { useNavigate, BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import CreatePage from './pages/CreatePage'
import ResultPage from './pages/ResultPage'
import Item from './components/Item/Item'
import JoinPage from './pages/JoinPage'
import ItemRequest from './components/ItemRequest/ItemRequest'
import CctpPage from './pages/CctpPage'

const queryClient = new QueryClient()

const generalConfig = {
  projectId,
  networks,
  metadata,
  themeMode: 'light' as const,
  themeVariables: {
    '--w3m-accent': '#000000',
  }
}

// Create modal
createAppKit({
  adapters: [wagmiAdapter],
  ...generalConfig,
  features: {
    analytics: true // Optional - defaults to your Cloud configuration
  }
})

export default function App() {
  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <Router>
          <Routes>
            <Route path="/" element={<AppContent />} />
            <Route path="/create" element={<CreatePage />} />
            <Route path="/result/:id/:chainid" element={<ResultPage />} />
            <Route path="/join/:groupId/:chainid" element={<JoinPage />} />
            <Route path="/cctp" element={<CctpPage />} />
          </Routes>
        </Router>
      </QueryClientProvider>
    </WagmiProvider>
  )
}

function AppContent() {
  const [activeTab, setActiveTab] = useState('tab1');
  const { isConnected, address } = useAppKitAccount();
  const navigate = useNavigate();
  const baseUrl = import.meta.env.VITE_API_ENDPOINT || '';

  return (
    <div className={"pages"}>
      <div className="header">
        <img src="/reown.svg" alt="Reown" style={{ width: '150px', height: '150px' }} />
        {isConnected && (
          <div className="nav-buttons">
            <button
              className="nav-button"
              onClick={() => navigate('/create')}
            >
              Create
            </button>
            <button
              className="nav-button"
              onClick={() => navigate('/cctp')}
            >
              CCTP Demo
            </button>
          </div>
        )}
      </div>
      <h1>AppKit Wagmi React dApp Example</h1>
      <appkit-button />
      <ActionButtonList 
        sendHash={() => {}} 
        sendSignMsg={() => {}} 
        sendBalance={() => {}} 
      />
      <SmartContractActionButtonList />
      <div className="advice">
        <p>
          This projectId only works on localhost. <br />
          Go to <a href="https://cloud.reown.com" target="_blank" className="link-button" rel="Reown Cloud">Reown Cloud</a> to get your own.
        </p>
      </div>
      {isConnected && address && (
        <div>
          <div className="tab-buttons">
            <button
              onClick={() => setActiveTab('tab1')}
              className={`tab-button ${activeTab === 'tab1' ? 'active' : ''}`}
            >
              Joined
            </button>
            <button
              onClick={() => setActiveTab('tab2')}
              className={`tab-button ${activeTab === 'tab2' ? 'active' : ''}`}
            >
              Request
            </button>
          </div>

          {activeTab === 'tab1' && (
            <ItemList account={address} apiEndpoint={`${baseUrl}/groups/joined`} ItemComponent={Item} />
          )}
          {activeTab === 'tab2' && (
            <ItemList account={address} apiEndpoint={`${baseUrl}/groups/request`} ItemComponent={ItemRequest} />
          )}
        </div>
      )}
    </div>
  )
}
