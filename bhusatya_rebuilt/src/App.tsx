import { useState } from 'react';
import { NavScreen, Language, Parcel } from './types';
import { mockParcels } from './data/mockData';
import { IndianState } from './data/indianStates';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { CitizenDashboard } from './components/screens/CitizenDashboard';
import { ExtractAndReview } from './components/screens/ExtractAndReview';
import { ParcelCheckGate } from './components/screens/ParcelCheckGate';
import { CadastralMapScreen } from './components/screens/CadastralMapScreen';
import { ShouldIBuyThisReport } from './components/screens/ShouldIBuyThisReport';
import { HeirConsentTracker } from './components/screens/HeirConsentTracker';
import { CertificateVerifier } from './components/screens/CertificateVerifier';
import { RevenueOfficerQueue } from './components/screens/RevenueOfficerQueue';
import { AdminDashboardScreen } from './components/screens/AdminDashboardScreen';
import { CheckParcelModal } from './components/modals/CheckParcelModal';
import { ShareReportModal } from './components/modals/ShareReportModal';
import { CertifiedPdfModal } from './components/modals/CertifiedPdfModal';
import { StateSelectorModal } from './components/modals/StateSelectorModal';
import { LanguageSelectorModal } from './components/modals/LanguageSelectorModal';
import { AuthModal } from './components/modals/AuthModal';
import { api, AuthUser } from './services/api';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<NavScreen>('citizen-dashboard');
  const [currentParcel, setCurrentParcel] = useState<Parcel>(mockParcels[0]);
  const [currentStateCode, setCurrentStateCode] = useState<string>('MH');
  const [language, setLanguage] = useState<Language>('EN');
  const [activeRole, setActiveRole] = useState<'citizen' | 'officer'>('citizen');
  const [customDocData, setCustomDocData] = useState<{ name: string; url?: string; type: string } | null>(null);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => api.getCurrentUser());

  // Modals
  const [isCheckModalOpen, setIsCheckModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [isStateModalOpen, setIsStateModalOpen] = useState(false);
  const [isLanguageModalOpen, setIsLanguageModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const handleLoginSuccess = (user: AuthUser) => {
    setCurrentUser(user);
    if (user.role === 'admin') {
      setActiveRole('officer');
      setCurrentScreen('revenue-officer-queue');
    } else {
      setActiveRole('citizen');
      setCurrentScreen('citizen-dashboard');
    }
  };

  const handleLogout = async () => {
    await api.logout();
    setCurrentUser(null);
    setActiveRole('citizen');
    setCurrentScreen('citizen-dashboard');
  };

  const handleRoleToggle = () => {
    if (activeRole === 'citizen') {
      setActiveRole('officer');
      setCurrentScreen('revenue-officer-queue');
    } else {
      setActiveRole('citizen');
      setCurrentScreen('citizen-dashboard');
    }
  };

  const handleSelectParcel = (parcel: Parcel) => {
    setCurrentParcel(parcel);
    if (parcel.stateCode) {
      setCurrentStateCode(parcel.stateCode);
    }
  };

  const handleUpdateParcel = (updated: Partial<Parcel>) => {
    setCurrentParcel((prev) => ({
      ...prev,
      ...updated,
    }));
  };

  const handleSelectState = (state: IndianState) => {
    setCurrentStateCode(state.code);
    if (state.primaryLanguage) {
      setLanguage(state.primaryLanguage);
    }
    const matching = mockParcels.find((p) => p.stateCode === state.code);
    if (matching) {
      setCurrentParcel(matching);
    } else {
      setCurrentParcel((prev) => ({
        ...prev,
        state: state.name,
        stateCode: state.code,
        district: state.sampleDistricts[0] || prev.district,
        surveyNo: state.sampleSurveyNo || prev.surveyNo,
        village: `Mauza ${state.sampleDistricts[0] || 'Center'}`,
      }));
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-slate-200 selection:text-slate-900">
      {/* Sovereign App Header */}
      <Header
        currentScreen={currentScreen}
        onNavigate={setCurrentScreen}
        language={language}
        onLanguageChange={setLanguage}
        activeRole={activeRole}
        onRoleToggle={handleRoleToggle}
        onOpenCheckModal={() => setIsCheckModalOpen(true)}
        currentStateCode={currentStateCode}
        onOpenStateModal={() => setIsStateModalOpen(true)}
        onOpenLanguageModal={() => setIsLanguageModalOpen(true)}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* Main Screen Content Viewport (offset for 28rem top fixed nav) */}
      <main className="w-full pt-28 flex-1">
        {currentScreen === 'citizen-dashboard' && (
          <CitizenDashboard
            onNavigate={setCurrentScreen}
            onSelectParcel={handleSelectParcel}
            onOpenCheckModal={() => setIsCheckModalOpen(true)}
            language={language}
            onCustomDocUploaded={setCustomDocData}
            currentStateCode={currentStateCode}
            onStateChange={handleSelectState}
            onOpenStateModal={() => setIsStateModalOpen(true)}
          />
        )}

        {currentScreen === 'extract-and-review' && (
          <ExtractAndReview
            currentParcel={currentParcel}
            onNavigate={setCurrentScreen}
            onUpdateParcel={handleUpdateParcel}
            customDocData={customDocData}
          />
        )}

        {currentScreen === 'parcel-check-and-red-flag-gate' && (
          <ParcelCheckGate
            currentParcel={currentParcel}
            onNavigate={setCurrentScreen}
            onDownloadRejectionNotice={() => setIsPdfModalOpen(true)}
          />
        )}

        {currentScreen === 'cadastral-map' && (
          <CadastralMapScreen
            currentParcel={currentParcel}
            onNavigate={setCurrentScreen}
            onSelectParcel={handleSelectParcel}
            language={language}
          />
        )}

        {currentScreen === 'should-i-buy-this-report' && (
          <ShouldIBuyThisReport
            currentParcel={currentParcel}
            onNavigate={setCurrentScreen}
            language={language}
            onLanguageChange={setLanguage}
            onOpenShareModal={() => setIsShareModalOpen(true)}
            onOpenPdfModal={() => setIsPdfModalOpen(true)}
          />
        )}

        {currentScreen === 'heir-consent-tracker' && (
          <HeirConsentTracker
            currentParcel={currentParcel}
            onNavigate={setCurrentScreen}
            onHeirConsentUpdated={() => {
              setCurrentParcel((prev) => ({
                ...prev,
                trustScore: 83,
                hasLitigation: false,
                status: 'WARN',
                tags: prev.tags.filter((t) => !t.includes('Suit')),
              }));
            }}
          />
        )}

        {currentScreen === 'certificate-and-verifier' && (
          <CertificateVerifier currentParcel={currentParcel} />
        )}

        {currentScreen === 'revenue-officer-queue' && (
          <AdminDashboardScreen
            onNavigate={setCurrentScreen}
            onSelectParcel={handleSelectParcel}
          />
        )}
      </main>

      {/* Sovereign Institutional Seals Footer */}
      <Footer />

      {/* Global Modals */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      <CheckParcelModal
        isOpen={isCheckModalOpen}
        onClose={() => setIsCheckModalOpen(false)}
        onSelectParcel={(parcel) => {
          handleSelectParcel(parcel);
          setCurrentScreen('should-i-buy-this-report');
        }}
      />

      <ShareReportModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        currentParcel={currentParcel}
      />

      <CertifiedPdfModal
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        currentParcel={currentParcel}
      />

      <StateSelectorModal
        isOpen={isStateModalOpen}
        onClose={() => setIsStateModalOpen(false)}
        currentStateCode={currentStateCode}
        onSelectState={handleSelectState}
      />

      <LanguageSelectorModal
        isOpen={isLanguageModalOpen}
        onClose={() => setIsLanguageModalOpen(false)}
        currentLanguage={language}
        onSelectLanguage={setLanguage}
      />
    </div>
  );
}
