import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ReactQueryDevtools } from 'react-query/devtools';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SnackbarProvider } from './contexts/SnackbarContext';
import { ItineraryProvider } from './contexts/ItineraryContext';
import { TransportProvider } from './contexts/TransportContext';
import { ExpenseProvider } from './contexts/ExpenseContext';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import { ItineraryListPage, ItineraryDetailPage, ItineraryCreatePage, ProfilePage, NotFoundPage, TransportBookingPage, ExpenseTrackerPage, WeatherPage, MemoriesPage, AIRecommendationsPage } from './pages/index';

// Create a client for React Query
const queryClient = new QueryClient();

// Create a theme instance
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 500,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 500,
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 500,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 4px 20px 0 rgba(0,0,0,0.05)',
          transition: 'transform 0.2s, box-shadow 0.2s',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 8px 30px 0 rgba(0,0,0,0.1)',
          },
        },
      },
    },
    MuiModal: {
      defaultProps: {
        disableEnforceFocus: true,
      },
    },
  },
});

// Protected Route component
const ProtectedRoute = ({ children }) => {
  const { currentUser } = useAuth();

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Public Route component
const PublicRoute = ({ children }) => {
  const { currentUser } = useAuth();

  if (currentUser) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <SnackbarProvider>
          <AuthProvider>
            <ItineraryProvider>
              <TransportProvider>
                <ExpenseProvider>
                  <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                    <Routes>
                      {/* Public routes */}
                      <Route path="/" element={
                        <PublicRoute>
                          <HomePage />
                        </PublicRoute>
                      } />

                      <Route path="/login" element={
                        <PublicRoute>
                          <LoginPage />
                        </PublicRoute>
                      } />

                      <Route path="/register" element={
                        <PublicRoute>
                          <RegisterPage />
                        </PublicRoute>
                      } />

                      {/* Protected routes */}
                      <Route path="/dashboard" element={
                        <ProtectedRoute>
                          <Layout>
                            <ItineraryListPage />
                          </Layout>
                        </ProtectedRoute>
                      } />

                      <Route path="/itineraries" element={
                        <ProtectedRoute>
                          <Layout>
                            <ItineraryListPage />
                          </Layout>
                        </ProtectedRoute>
                      } />

                      <Route path="/itineraries/create" element={
                        <ProtectedRoute>
                          <Layout>
                            <ItineraryCreatePage />
                          </Layout>
                        </ProtectedRoute>
                      } />

                      <Route path="/itineraries/:id" element={
                        <ProtectedRoute>
                          <Layout>
                            <ItineraryDetailPage />
                          </Layout>
                        </ProtectedRoute>
                      } />

                      <Route path="/profile" element={
                        <ProtectedRoute>
                          <Layout>
                            <ProfilePage />
                          </Layout>
                        </ProtectedRoute>
                      } />

                      <Route path="/transport" element={
                        <ProtectedRoute>
                          <Layout>
                            <TransportBookingPage />
                          </Layout>
                        </ProtectedRoute>
                      } />

                      <Route path="/expenses" element={
                        <ProtectedRoute>
                          <Layout>
                            <ExpenseTrackerPage />
                          </Layout>
                        </ProtectedRoute>
                      } />

                      <Route path="/weather" element={
                        <ProtectedRoute>
                          <Layout>
                            <WeatherPage />
                          </Layout>
                        </ProtectedRoute>
                      } />

                      <Route path="/memories" element={
                        <ProtectedRoute>
                          <Layout>
                            <MemoriesPage />
                          </Layout>
                        </ProtectedRoute>
                      } />

                      <Route path="/recommendations" element={
                        <ProtectedRoute>
                          <Layout>
                            <AIRecommendationsPage />
                          </Layout>
                        </ProtectedRoute>
                      } />

                      {/* 404 - Not Found */}
                      <Route path="*" element={<NotFoundPage />} />
                    </Routes>
                  </Router>
                </ExpenseProvider>
              </TransportProvider>
            </ItineraryProvider>
          </AuthProvider>
        </SnackbarProvider>
        <ReactQueryDevtools initialIsOpen={false} />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
