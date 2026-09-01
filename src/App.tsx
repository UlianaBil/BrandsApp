import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"
import { Shell } from "./layout"
import { DemoPanel, ToastProvider } from "./ui"
import MyBrands from "./pages/MyBrands"
import CreateBrand from "./pages/CreateBrand"
import Overview from "./pages/Overview"
import Billing from "./pages/Billing"
import Finances from "./pages/Finances"
import Team from "./pages/Team"
import Settings from "./pages/Settings"
import Marketplace from "./pages/Marketplace"

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <Shell>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<MyBrands />} />
            <Route path="/dashboard/create" element={<CreateBrand />} />
            <Route path="/dashboard/:slug" element={<Overview />} />
            <Route path="/dashboard/:slug/billing" element={<Billing />} />
            <Route path="/dashboard/:slug/finances" element={<Finances />} />
            <Route path="/dashboard/:slug/team" element={<Team />} />
            <Route path="/dashboard/:slug/settings" element={<Settings />} />
            <Route path="/dashboard/:slug/marketplace" element={<Marketplace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Shell>
        <DemoPanel />
      </ToastProvider>
    </BrowserRouter>
  )
}
