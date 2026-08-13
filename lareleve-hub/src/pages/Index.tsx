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

type Tab = 'home' | 'contacts' | 'members' | 'documents' | 'construction';

export default function Index() {
  const { data, setContacts, setEntrepreneurContacts, addMember, deleteMember, updateMember } = useAppData();
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
      default:
        return null;
    }
  };

  return (
    <div className="relative isolate min-h-screen bg-background text-foreground">
      <div className="fixed inset-0 z-0 bg-[url('/fond.png')] bg-cover bg-center bg-no-repeat" />
      <div className="fixed inset-0 z-0 bg-black/[0.35]" />
      <div className="relative z-10">
        <AppSidebar activeTab={activeTab} setActiveTab={(t) => { setActiveTab(t as Tab); setSelectedMemberId(null); }} onLogoClick={handleLogoClick} />
      </div>
      <div className="relative z-10 flex min-h-screen flex-col">
        <AppHeader />
        <main className="mx-auto w-full max-w-[1500px] flex-1 px-4 pb-8 sm:px-6 lg:px-8">
          <div className="rounded-lg border border-white/10 bg-white/[0.86] p-4 shadow-[0_24px_80px_rgba(0,0,0,0.32)] backdrop-blur-md sm:p-6 lg:p-7">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
}
