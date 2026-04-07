import { Home, Users, BookUser, FolderOpen, Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

type Tab = 'home' | 'contacts' | 'members' | 'documents';

interface SidebarProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  onLogoClick: () => void;
}

const navItems: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'home', label: 'Accueil', icon: Home },
  { id: 'contacts', label: 'Contacts', icon: BookUser },
  { id: 'members', label: 'Membres', icon: Users },
  { id: 'documents', label: 'Offres / Docs', icon: FolderOpen },
];

export default function AppSidebar({ activeTab, setActiveTab, onLogoClick }: SidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleNav = (tab: Tab) => {
    setActiveTab(tab);
    setMobileOpen(false);
  };

  return (
    <>
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-3 left-3 z-50 p-2 rounded-md bg-noir text-primary-foreground"
        aria-label="Ouvrir le menu"
      >
        <Menu size={20} />
      </button>

      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-foreground/40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          'fixed lg:sticky z-50 top-0 left-0 h-screen w-64 bg-noir flex flex-col shrink-0 transition-transform duration-200',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-sidebar-border">
          <button onClick={onLogoClick} className="text-xl font-bold text-primary tracking-wide">
            LaReleve
          </button>
          <button onClick={() => setMobileOpen(false)} className="lg:hidden text-sidebar-foreground">
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => handleNav(id)}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-default',
                activeTab === id
                  ? 'bg-primary text-primary-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent'
              )}
            >
              <Icon size={18} />
              {label}
            </button>
          ))}
        </nav>

        <div className="px-6 py-4 border-t border-sidebar-border">
          <p className="text-xs text-muted-foreground">© LaReleve - L'incubateur de MDB</p>
        </div>
      </aside>
    </>
  );
}
