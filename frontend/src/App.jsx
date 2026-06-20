import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import DashboardLayout from '@/components/layout/DashboardLayout'
import Overview from '@/pages/Overview'
import HotspotIntelligence from '@/pages/HotspotIntelligence'
import CIPDashboard from '@/pages/CIPDashboard'
import Forecasting from '@/pages/Forecasting'
import ConfidenceEngine from '@/pages/ConfidenceEngine'
import Opportunities from '@/pages/Opportunities'
import ResourcePlanner from '@/pages/ResourcePlanner'
import TargetPlanner from '@/pages/TargetPlanner'
import StationAnalytics from '@/pages/StationAnalytics'
import CoverageAnalysis from '@/pages/CoverageAnalysis'
import SettingsPage from '@/pages/Settings'
import LandingPage from '@/pages/Landing'
import useStore from '@/store/useStore'

function ProtectedRoute({ children }) {
  const isAuthenticated = useStore((s) => s.isAuthenticated)
  return isAuthenticated ? children : <Navigate to="/login" replace />
}

function PublicRoute({ children }) {
  const isAuthenticated = useStore((s) => s.isAuthenticated)
  return !isAuthenticated ? children : <Navigate to="/" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            <PublicRoute>
              <LandingPage />
            </PublicRoute>
          }
        />
        <Route
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Overview />} />
          <Route path="hotspots" element={<HotspotIntelligence />} />
          <Route path="cip" element={<CIPDashboard />} />
          <Route path="forecast" element={<Forecasting />} />
          <Route path="confidence" element={<ConfidenceEngine />} />
          <Route path="opportunities" element={<Opportunities />} />
          <Route path="resource-planner" element={<ResourcePlanner />} />
          <Route path="target-planner" element={<TargetPlanner />} />
          <Route path="stations" element={<StationAnalytics />} />
          <Route path="coverage" element={<CoverageAnalysis />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
