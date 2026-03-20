import { useState } from 'react';
import { useAppData } from '@/hooks/useAppData';
import AppSidebar from '@/components/layout/AppSidebar';
import AppHeader from '@/components/layout/AppHeader';
import Dashboard from '@/components/dashboard/Dashboard';
import ContactsPage from '@/components/contacts/ContactsPage';
import MembersPage from '@/components/members/MembersPage';
import MemberDetail from '@/components/members/MemberDetail';
import DocumentsPage from '@/components/documents/DocumentsPage';

type Tab = 'home' | 'contacts' | 'members' | 'documents';

export default function Index() {
  const { data, setContacts, addMember, deleteMember, updateMember } = useAppData();
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
        return <ContactsPage contacts={data.contacts} setContacts={setContacts} />;
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
      default:
        return null;
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar activeTab={activeTab} setActiveTab={(t) => { setActiveTab(t as Tab); setSelectedMemberId(null); }} onLogoClick={handleLogoClick} />
      <div className="flex-1 flex flex-col lg:ml-0">
        <AppHeader />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}
