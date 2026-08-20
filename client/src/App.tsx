import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import { Navbar } from './components/common/Navbar';
import { NotificationDrawer } from './components/common/NotificationDrawer';
import { Modal } from './components/common/Modal';
import { QuickQuoteCalculator } from './components/customer/QuickQuoteCalculator';
import { OrderBookingModal } from './components/customer/OrderBookingModal';
import { LoginModal } from './components/common/LoginModal';
import { HomePage } from './pages/HomePage';
import { CustomerPage } from './pages/CustomerPage';
import { AgentPage } from './pages/AgentPage';
import { AdminPage } from './pages/AdminPage';
import { TrackingPage } from './pages/TrackingPage';
import { Truck, ShieldCheck, Github, ExternalLink } from 'lucide-react';


export const App: React.FC = () => {
  const { user } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>('home');
  const [isQuickQuoteOpen, setIsQuickQuoteOpen] = useState<boolean>(false);
  const [isBookOrderOpen, setIsBookOrderOpen] = useState<boolean>(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [passedQuoteData, setPassedQuoteData] = useState<any>(null);
  const [activeTrackingNumber, setActiveTrackingNumber] = useState<string>('TRK-2026-MUM901');

  const handleOpenBookOrder = (quoteData?: any) => {
    if (quoteData) setPassedQuoteData(quoteData);
    setIsQuickQuoteOpen(false);
    setIsBookOrderOpen(true);
  };

  const handleViewOrderTrack = (trackingNumber: string) => {
    setActiveTrackingNumber(trackingNumber);
    setCurrentTab('tracking');
  };

  const handleOrderBookedSuccess = (newOrder: any) => {
    setIsBookOrderOpen(false);
    setActiveTrackingNumber(newOrder.trackingNumber);
    setCurrentTab('tracking');
  };

  const handleRoleRedirect = (role: 'CUSTOMER' | 'AGENT' | 'ADMIN') => {
    if (role === 'ADMIN') {
      setCurrentTab('admin');
    } else if (role === 'AGENT') {
      setCurrentTab('agent');
    } else {
      setCurrentTab('customer');
    }
  };


  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col justify-between">
      
      {/* Top Fixed Header */}
      <div>
        <Navbar
          currentTab={currentTab}
          setCurrentTab={setCurrentTab}
          onOpenQuickQuote={() => setIsQuickQuoteOpen(true)}
          onOpenBookOrder={() => handleOpenBookOrder()}
          onOpenLoginModal={() => setIsLoginModalOpen(true)}
        />

        {/* Main Content View Container */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          {currentTab === 'home' && (
            <HomePage
              onNavigate={setCurrentTab}
              onOpenBookOrder={handleOpenBookOrder}
              onTrackOrder={handleViewOrderTrack}
            />
          )}

          {currentTab === 'customer' && (
            <CustomerPage
              onOpenBookOrder={() => handleOpenBookOrder()}
              onViewDeepTrack={handleViewOrderTrack}
            />
          )}

          {currentTab === 'agent' && <AgentPage />}

          {currentTab === 'admin' && (
            <AdminPage
              onViewOrderTrack={handleViewOrderTrack}
              onOpenCreateOrder={() => handleOpenBookOrder()}
            />
          )}

          {currentTab === 'tracking' && (
            <TrackingPage
              initialTrackingNumber={activeTrackingNumber}
              onBack={() => setCurrentTab(user?.role === 'ADMIN' ? 'admin' : 'customer')}
            />
          )}
        </main>
      </div>

      {/* Global Modals */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onSuccessRedirect={handleRoleRedirect}
      />

      {isQuickQuoteOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsQuickQuoteOpen(false)}
          title="Instant Shipping Rate Calculator"
          subtitle="Real-time volumetric weight and multi-zone tariff engine"
          maxWidth="max-w-3xl"
        >
          <QuickQuoteCalculator
            onSelectBookWithQuote={(quote) => handleOpenBookOrder(quote)}
          />
        </Modal>
      )}

      {isBookOrderOpen && (
        <Modal
          isOpen={true}
          onClose={() => {
            setIsBookOrderOpen(false);
            setPassedQuoteData(null);
          }}
          title="Book Delivery Order"
          subtitle="Create new shipment with transparent live rate breakdown"
          maxWidth="max-w-3xl"
        >
          <OrderBookingModal
            initialQuoteData={passedQuoteData}
            onSuccess={handleOrderBookedSuccess}
            onClose={() => {
              setIsBookOrderOpen(false);
              setPassedQuoteData(null);
            }}
          />
        </Modal>
      )}

      {/* Slide-out Notification Drawer */}
      <NotificationDrawer />


      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/80 py-6 mt-12 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Truck className="w-4 h-4 text-brand-400" />
            <span className="font-bold text-slate-200">LogiTrack Enterprise Platform</span>
            <span>•</span>
            <span>Dynamic Rate Engine • Haversine Auto-Assignment • Immutable Audit Trail</span>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-slate-500">
            <span>Admin: <code className="text-slate-300 font-mono">admin@delivery.com</code></span>
            <span>Customer: <code className="text-slate-300 font-mono">john@example.com</code></span>
            <span>Agent: <code className="text-slate-300 font-mono">rajesh.agent@delivery.com</code></span>
          </div>
        </div>
      </footer>

    </div>
  );
};
