import { Navigate, Route, Routes } from 'react-router-dom';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterChoicePage } from './pages/auth/RegisterChoicePage';
import { RegisterStudentPage } from './pages/auth/RegisterStudentPage';
import { RegisterTeacherPage } from './pages/auth/RegisterTeacherPage';
import { StudentDashboard } from './pages/student/StudentDashboard';
import { StudentModules } from './pages/student/StudentModules';
import { StudentQuiz } from './pages/student/StudentQuiz';
import { StudentReflection } from './pages/student/StudentReflection';
import { TeacherDashboard } from './pages/teacher/TeacherDashboard';
import { TeacherModules } from './pages/teacher/TeacherModules';
import { ProtectedRoute } from './components/ProtectedRoute';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterChoicePage />} />
      <Route path="/register/siswa" element={<RegisterStudentPage />} />
      <Route path="/register/guru" element={<RegisterTeacherPage />} />
      <Route path="/siswa" element={<ProtectedRoute role="student"><StudentDashboard /></ProtectedRoute>} />
      <Route path="/siswa/modul" element={<ProtectedRoute role="student"><StudentModules /></ProtectedRoute>} />
      <Route path="/siswa/quiz" element={<ProtectedRoute role="student"><StudentQuiz /></ProtectedRoute>} />
      <Route path="/siswa/refleksi" element={<ProtectedRoute role="student"><StudentReflection /></ProtectedRoute>} />
      <Route path="/guru" element={<ProtectedRoute role="teacher"><TeacherDashboard /></ProtectedRoute>} />
      <Route path="/guru/modul" element={<ProtectedRoute role="teacher"><TeacherModules /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
