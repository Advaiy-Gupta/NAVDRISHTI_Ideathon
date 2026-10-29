import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import './index.css';
import Layout from './components/Layout';
import { LanguageProvider } from './state/i18n';
import { StoreProvider } from './state/store';
import { GuideProvider } from './state/guide';
import HomePage from './pages/HomePage';
import AssistantPage from './pages/AssistantPage';
import NewComplaintPage from './pages/NewComplaintPage';
import ComplaintsPage from './pages/ComplaintsPage';
import ComplaintDetailPage from './pages/ComplaintDetailPage';
import PublicDashboardPage from './pages/PublicDashboardPage';
import AuthoritiesPage from './pages/AuthoritiesPage';
import ServicesPage from './pages/ServicesPage';
import PrivacyPage from './pages/PrivacyPage';
import DemoSettingsPage from './pages/DemoSettingsPage';
import MockPortalPage from './pages/MockPortalPage';
import NotFoundPage from './pages/NotFoundPage';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <LanguageProvider>
      <StoreProvider>
        <GuideProvider>
          <BrowserRouter>
            <Routes>
              <Route element={<Layout />}>
                <Route index element={<HomePage />} />
                <Route path="assistant" element={<AssistantPage />} />
                <Route path="complaint/new" element={<NewComplaintPage />} />
                <Route path="complaints" element={<ComplaintsPage />} />
                <Route path="complaints/:id" element={<ComplaintDetailPage />} />
                <Route path="public-dashboard" element={<PublicDashboardPage />} />
                <Route path="authorities" element={<AuthoritiesPage />} />
                <Route path="services" element={<ServicesPage />} />
                <Route path="privacy" element={<PrivacyPage />} />
                <Route path="demo" element={<DemoSettingsPage />} />
                <Route path="mock-portal/:id" element={<MockPortalPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </GuideProvider>
      </StoreProvider>
    </LanguageProvider>
  </React.StrictMode>,
);
