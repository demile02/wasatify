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

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterChoicePage />} />
      <Route path="/register/siswa" element={<RegisterStudentPage />} />
      <Route path="/register/guru" element={<RegisterTeacherPage />} />
      <Route path="/siswa" element={<StudentDashboard />} />
      <Route path="/siswa/modul" element={<StudentModules />} />
      <Route path="/siswa/quiz" element={<StudentQuiz />} />
      <Route path="/siswa/refleksi" element={<StudentReflection />} />
      <Route path="/guru" element={<TeacherDashboard />} />
      <Route path="/guru/modul" element={<TeacherModules />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
