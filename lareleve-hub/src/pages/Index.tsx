import { useState } from 'react';
import { useAppData } from '@/hooks/useAppData';
import AppSidebar from '@/components/layout/AppSidebar';
import AppHeader from '@/components/layout/AppHeader';
import Dashboard from '@/components/dashboard/Dashboard';
import ContactsPage from '@/components/contacts/ContactsPage';
import MembersPage from '@/components/members/MembersPage';
import MemberDetail from '@/components/members/MemberDetail';
import DocumentsPage from '@/components/documents/DocumentsPage';
import ConstructionPage from '@/components/construction/ConstructionPage';
import AdminPage from '@/components/admin/AdminPage';
import { useAuth } from '@/context/AuthContext';

type Tab = 'home' | 'contacts' | 'members' | 'documents' | 'construction' | 'admin';

export default function Index() {
  const { data, setContacts, setEntrepreneurContacts, addMember, deleteMember, updateMember } = useAppData();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);

  const handleLogoClick = () => {
    setActiveTab('home');
    setSelectedMemberId(null);
  };

  const renderContent = () => {
    if (selectedMemberId) {
      const member = data.members.find(m => m.id === selectedMemberId);
      if (!member) return null;
      return (
        <MemberDetail
          member={member}
          onBack={() => setSelectedMemberId(null)}
          onUpdate={updateMember}
        />
      );
    }

    switch (activeTab) {
      case 'home':
        return <Dashboard data={data} onSelectMember={setSelectedMemberId} />;
      case 'contacts':
        return (
          <ContactsPage
            contacts={data.contacts}
            setContacts={setContacts}
            entrepreneurContacts={data.entrepreneurContacts}
            setEntrepreneurContacts={setEntrepreneurContacts}
          />
        );
      case 'members':
        return (
          <MembersPage
            members={data.members}
            onSelectMember={setSelectedMemberId}
            onAddMember={addMember}
            onDeleteMember={deleteMember}
          />
        );
      case 'documents':
        return <DocumentsPage />;
      case 'construction':
        return <ConstructionPage />;
      case 'admin':
        return user?.role === 'admin' ? <AdminPage /> : null;
      default:
        return null;
    }
  };

  return (
    <div className="app-shell">
      <div className="app-bg" />
      <div className="app-layer">
        <AppSidebar activeTab={activeTab} setActiveTab={(t) => { setActiveTab(t as Tab); setSelectedMemberId(null); }} onLogoClick={handleLogoClick} isAdmin={user?.role === 'admin'} />
      </div>
      <div className="app-layer flex min-h-screen flex-col">
        <AppHeader />
        <main className="app-main">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}
