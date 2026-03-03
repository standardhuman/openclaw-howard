import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import TasksPage from './pages/Tasks'
import CalendarPage from './pages/Calendar'
import ProjectsPage from './pages/Projects'
import MemoryPage from './pages/Memory'
import DocsPage from './pages/Docs'
import TeamPage from './pages/Team'
import SystemPage from './pages/System'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Navigate to="/team" replace />} />
        <Route path="/tasks" element={<TasksPage />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/memory" element={<MemoryPage />} />
        <Route path="/docs" element={<DocsPage />} />
        <Route path="/team" element={<TeamPage />} />
        <Route path="/system" element={<SystemPage />} />
      </Route>
    </Routes>
  )
}
