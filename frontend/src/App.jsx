import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import TrainerDashboard from './pages/TrainerDashboard';
import MemberDashboard from './pages/MemberDashboard';
import MembersPage from './pages/MembersPage';
import TrainersPage from './pages/TrainersPage';
import MembershipsPage from './pages/MembershipsPage';
import SubscriptionsPage from './pages/SubscriptionsPage';
import WorkoutPlansPage from './pages/WorkoutPlansPage';
import SchedulesPage from './pages/SchedulesPage';
import AttendancePage from './pages/AttendancePage';
import FitnessProgressPage from './pages/FitnessProgressPage';
import ProfilePage from './pages/ProfilePage';

// Root redirect handler based on authenticated role
const RootRedirect = () => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="d-flex align-items-center justify-content-center vh-100 bg-light">
        <div className="spinner-border text-primary" role="status"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
  if (user?.role === 'trainer') return <Navigate to="/trainer/dashboard" replace />;
  return <Navigate to="/member/dashboard" replace />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Root Redirect */}
          <Route path="/" element={<RootRedirect />} />

          {/* Authenticated Dashboard Layout */}
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            {/* Admin Routes */}
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/members"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <MembersPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/trainers"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <TrainersPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/memberships"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <MembershipsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/subscriptions"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <SubscriptionsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/workout-plans"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <WorkoutPlansPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/schedules"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <SchedulesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/attendance"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AttendancePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/fitness-progress"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <FitnessProgressPage />
                </ProtectedRoute>
              }
            />

            {/* Trainer Routes */}
            <Route
              path="/trainer/dashboard"
              element={
                <ProtectedRoute allowedRoles={['trainer']}>
                  <TrainerDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/trainer/members"
              element={
                <ProtectedRoute allowedRoles={['trainer']}>
                  <MembersPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/trainer/workout-plans"
              element={
                <ProtectedRoute allowedRoles={['trainer']}>
                  <WorkoutPlansPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/trainer/schedules"
              element={
                <ProtectedRoute allowedRoles={['trainer']}>
                  <SchedulesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/trainer/attendance"
              element={
                <ProtectedRoute allowedRoles={['trainer']}>
                  <AttendancePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/trainer/fitness-progress"
              element={
                <ProtectedRoute allowedRoles={['trainer']}>
                  <FitnessProgressPage />
                </ProtectedRoute>
              }
            />

            {/* Member Routes */}
            <Route
              path="/member/dashboard"
              element={
                <ProtectedRoute allowedRoles={['member']}>
                  <MemberDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/member/workout-plans"
              element={
                <ProtectedRoute allowedRoles={['member']}>
                  <WorkoutPlansPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/member/schedules"
              element={
                <ProtectedRoute allowedRoles={['member']}>
                  <SchedulesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/member/attendance"
              element={
                <ProtectedRoute allowedRoles={['member']}>
                  <AttendancePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/member/subscriptions"
              element={
                <ProtectedRoute allowedRoles={['member']}>
                  <SubscriptionsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/member/fitness-progress"
              element={
                <ProtectedRoute allowedRoles={['member']}>
                  <FitnessProgressPage />
                </ProtectedRoute>
              }
            />

            {/* Shared Accessible Routes */}
            <Route path="/memberships" element={<MembershipsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
