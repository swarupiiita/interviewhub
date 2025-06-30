// src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout/Layout';
import LoginForm from './components/Auth/LoginForm';
import RegisterForm from './components/Auth/RegisterForm';
import ExperienceList from './components/Experience/ExperienceList';
import CompanyList from './components/Company/CompanyList';
import CompanyDetail from './components/Company/CompanyDetail';
import QuestionList from './components/Question/QuestionList';
import ShareExperience from './components/Experience/ShareExperience';
import Profile from './components/Profile/Profile';

const App: React.FC = () => (
  <AuthProvider>
    <AppWithAuth />
  </AuthProvider>
);

const AppWithAuth: React.FC = () => {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginForm />} />
        <Route path="/register" element={<RegisterForm />} />

        <Route
          path="/"
          element={
            <Layout>
              <ExperienceList />
            </Layout>
          }
        />

        <Route
          path="/companies"
          element={
            <Layout>
              <CompanyList />
            </Layout>
          }
        />

        <Route
          path="/companies/:id"
          element={
            <Layout>
              <CompanyDetail />
            </Layout>
          }
        />

        <Route
          path="/questions"
          element={
            <Layout>
              <QuestionList />
            </Layout>
          }
        />

        <Route
          path="/share"
          element={
            <Layout>
              <ShareExperience />
            </Layout>
          }
        />

        <Route
          path="/profile"
          element={
            <Layout>
              <Profile />
            </Layout>
          }
        />
      </Routes>
    </Router>
  );
};

export default App;
