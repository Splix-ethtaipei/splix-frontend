import { createAppKit, useAppKitAccount } from '@reown/appkit/react'

import { WagmiProvider } from 'wagmi'
import { useState } from 'react'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
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
import PayPage from './pages/PayPage'

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
            <Route path="/join/:groupId/:chainId" element={<JoinPage />} />
            <Route path="/cctp" element={<CctpPage />} />
            <Route path="/pay" element={<PayPage />} />
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
        <img 
          src="/splix-logo.jpg" 
          alt="SpliX" 
          className="splix-logo"
          onError={(e) => {
            e.currentTarget.src = '../src/assets/splix-logo.svg';
          }}
        />
        <div className="header-right">
          <appkit-button />
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
      </div>
      {isConnected && address && (
        <div className="main-content">
          <div className="tab-container">
            <div className="tab-buttons">
              <button
                onClick={() => setActiveTab('tab1')}
                className={`tab-button ${activeTab === 'tab1' ? 'active' : ''}`}
              >
                <span className="tab-icon">👥</span>
                My Groups
              </button>
              <button
                onClick={() => setActiveTab('tab2')}
                className={`tab-button ${activeTab === 'tab2' ? 'active' : ''}`}
              >
                <span className="tab-icon">📨</span>
                Pending Invites
              </button>
            </div>

            <div className="tab-content">
              {activeTab === 'tab1' && (
                <div className="column">
                  <div className="column-content">
                    <h2 className="column-title">Payment Groups You've Joined</h2>
                    <ItemList account={address} apiEndpoint={`${baseUrl}/groups/joined`} ItemComponent={Item} />
                  </div>
                </div>
              )}
              {activeTab === 'tab2' && (
                <div className="list-container">
                  <h2>Group Invitations</h2>
                  <ItemList account={address} apiEndpoint={`${baseUrl}/groups/request`} ItemComponent={ItemRequest} />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
