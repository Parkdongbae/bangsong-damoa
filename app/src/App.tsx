import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './lib/auth'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import ProblemListPage from './pages/ProblemListPage'
import ProblemDetailPage from './pages/ProblemDetailPage'
import TemplateListPage from './pages/TemplateListPage'
import TemplateDetailPage from './pages/TemplateDetailPage'
import QaListPage from './pages/QaListPage'
import QaNewPage from './pages/QaNewPage'
import QaDetailPage from './pages/QaDetailPage'
import FavoritesPage from './pages/FavoritesPage'
import ExamChecklistPage from './pages/ExamChecklistPage'
import AdminPage from './pages/AdminPage'
import LoginPage from './pages/LoginPage'
import NotFoundPage from './pages/NotFoundPage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      retry: 1,
    },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/problems" element={<ProblemListPage />} />
              <Route path="/problems/:id" element={<ProblemDetailPage />} />
              <Route path="/templates" element={<TemplateListPage />} />
              <Route path="/templates/:id" element={<TemplateDetailPage />} />
              <Route path="/qa" element={<QaListPage />} />
              <Route path="/qa/new" element={<QaNewPage />} />
              <Route path="/qa/:id" element={<QaDetailPage />} />
              <Route path="/favorites" element={<FavoritesPage />} />
              <Route path="/checklist/exam" element={<ExamChecklistPage />} />
              <Route path="/admin" element={<AdminPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  )
}
