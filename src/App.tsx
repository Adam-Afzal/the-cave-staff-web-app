// src/App.tsx
import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Layout } from './components/layout'
import { LoginPage, DashboardPage, ConciergePage } from './pages'
import { ClientCallsPage } from './pages/ClientCallsPage'
import { EventsPage } from './pages/EventsPage'
import { EventSignupPage } from './pages/EventSignUpPage'
import { FeatureFlagsPage } from './pages/FeatureFlagsPage'
import { EngagementPage } from './pages/EngagementPage'
import { ProfileSetupPage } from './pages/ProfileSetupPage'
import { EditProfilePage } from './pages/EditProfilePage'
import { StaffManagementPage } from './pages/StaffManagementPage'
import { B2BAssessmentPage } from './pages/B2BAssessmentPage'
import { B2BAssessmentDetailPage } from './pages/B2BAssessmentDetailPage'
import { B2BIntrosPage } from './pages/B2BIntrosPage'
import { ScheduledCallsPage } from './pages/ScheduledCallsPage'
import { MemberProfilePage } from './pages/MemberProfilePage'
import { EntitiesPage } from './pages/EntitiesPage'
import { AnalyticsPage } from './pages/AnalyticsPage'
import { useCurrentStaffProfile } from './hooks/useStaffProfile'
import { supabase } from './lib/supabase'
import { OnboardingFormsPage } from './pages/OnboardingFormsPage'
import { OnboardingFormBuilderPage } from './pages/OnboardingFormBuilderPage'
import { OnboardingFormPage } from './pages/OnboardingFormPage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
})

// Onboarding check wrapper
function OnboardingCheck({ children }: { children: React.ReactNode }) {
  const { data: profile, isLoading } = useCurrentStaffProfile()
  const location = useLocation()

  // Don't redirect if already on setup page
  if (location.pathname === '/profile/setup') {
    return <>{children}</>
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-cave-bg-primary flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-cave-gold border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // Redirect to setup if onboarding not completed
  if (profile && !profile.onboarding_completed) {
    return <Navigate to="/profile/setup" replace />
  }

  return <>{children}</>
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session)
      setIsLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-cave-bg-primary flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-cave-gold border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/events/:slug" element={<EventSignupPage />} />
          <Route path="/events/:slug/guest/:memberId" element={<EventSignupPage />} />
          <Route path="/onboarding/:slug" element={<OnboardingFormPage />} />
          
          {/* Profile Setup - No layout, standalone page */}
          <Route path="/profile/setup" element={
            <ProtectedRoute>
              <ProfileSetupPage />
            </ProtectedRoute>
          } />
          
          {/* Main App with Layout */}
          <Route element={
            <ProtectedRoute>
              <OnboardingCheck>
                <Layout />
              </OnboardingCheck>
            </ProtectedRoute>
          }>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/members" element={<Navigate to="/entities" replace />} />
            <Route path="/members/:memberId" element={<MemberProfilePage />} />
            <Route path="/entities" element={<EntitiesPage />} />
            <Route path="/concierge" element={<ConciergePage/>} />
            <Route path="/calls" element={<ClientCallsPage />} />
            <Route path="/events" element={<EventsPage />} />
            <Route path="/engagement" element={<EngagementPage />} />
            <Route path="/feature-flags" element={<FeatureFlagsPage />} />
            <Route path="/staff" element={<StaffManagementPage />} />
            <Route path="/profile/edit" element={<EditProfilePage />} />
            <Route path="/b2b/assess" element={<B2BAssessmentPage />} />
            <Route path="/b2b/assess/:assessmentId" element={<B2BAssessmentDetailPage />} />
            <Route path="/b2b/intros" element={<B2BIntrosPage />} />
            <Route path="/b2b/calls" element={<ScheduledCallsPage />} />
            <Route path="/onboarding-forms" element={<OnboardingFormsPage />} />
            <Route  path="/staff/onboarding-forms/:id/edit"  element={<OnboardingFormBuilderPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/settings" element={<div className="p-6 text-cave-text-primary">Settings - Coming Soon</div>} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}