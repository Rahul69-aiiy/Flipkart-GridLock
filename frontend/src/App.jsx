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
import ValueProof from '@/pages/ValueProof'
import StationAnalytics from '@/pages/StationAnalytics'
import CoverageAnalysis from '@/pages/CoverageAnalysis'
import SettingsPage from '@/pages/Settings'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<DashboardLayout />}>
          <Route index element={<Overview />} />
          <Route path="hotspots" element={<HotspotIntelligence />} />
          <Route path="cip" element={<CIPDashboard />} />
          <Route path="forecast" element={<Forecasting />} />
          <Route path="confidence" element={<ConfidenceEngine />} />
          <Route path="opportunities" element={<Opportunities />} />
          <Route path="resource-planner" element={<ResourcePlanner />} />
          <Route path="target-planner" element={<TargetPlanner />} />
          <Route path="value-proof" element={<ValueProof />} />
          <Route path="stations" element={<StationAnalytics />} />
          <Route path="coverage" element={<CoverageAnalysis />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
