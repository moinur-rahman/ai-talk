import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Provider } from 'react-redux';
import { Toaster } from 'sonner';
import { store } from '@/redux/store';
import ProtectedRoute from '@/guards/ProtectedRoute';
import PublicRoute from '@/guards/PublicRoute';
import WorkspaceLayout from '@/layouts/WorkspaceLayout';
import ChatLayout from '@/layouts/ChatLayout';
import AdminLayout from '@/layouts/AdminLayout';
import SettingsLayout from '@/layouts/SettingsLayout';
import LoginPage from '@/pages/auth/LoginPage';
import RegisterPage from '@/pages/auth/RegisterPage';
import NewChatPage from '@/pages/workspace/NewChatPage';
import ChatPage from '@/pages/workspace/ChatPage';
import ProjectsPage from '@/pages/workspace/ProjectsPage';
import ProjectDetailPage from '@/pages/workspace/ProjectDetailPage';
import ImageGenerationPage from '@/pages/workspace/ImageGenerationPage';
import UsagePage from '@/pages/workspace/UsagePage';
import GeneralSettingsPage from '@/pages/workspace/settings/GeneralSettingsPage';
import DataSettingsPage from '@/pages/workspace/settings/DataSettingsPage';
import AdminModelsPage from '@/pages/admin/AdminModelsPage';

const App = () => {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <Routes>
          {/* Public routes — redirect to /new if already authenticated */}
          <Route element={<PublicRoute />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
          </Route>

          {/* Protected routes */}
          <Route element={<ProtectedRoute />}>
            {/* Admin — own full-screen layout, not inside workspace */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Navigate to="/admin/models" replace />} />
              <Route path="models" element={<AdminModelsPage />} />
            </Route>

            {/* Workspace (sidebar + chat context) */}
            <Route element={<WorkspaceLayout />}>
              {/* Chat section (voice agent context) */}
              <Route element={<ChatLayout />}>
                <Route index element={<Navigate to="/new" replace />} />
                <Route path="/new" element={<NewChatPage />} />
                <Route path="/chat/:conversationId" element={<ChatPage />} />
              </Route>

              <Route path="/projects" element={<ProjectsPage />} />
              <Route
                path="/projects/:projectId"
                element={<ProjectDetailPage />}
              />
              <Route
                path="/image-generation"
                element={<ImageGenerationPage />}
              />
              <Route path="/usage" element={<UsagePage />} />

              {/* Settings with nested nav layout */}
              <Route path="/settings" element={<SettingsLayout />}>
                <Route
                  index
                  element={<Navigate to="/settings/general" replace />}
                />
                <Route path="general" element={<GeneralSettingsPage />} />
                <Route path="data" element={<DataSettingsPage />} />
              </Route>
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" richColors />
    </Provider>
  );
};

export default App;
