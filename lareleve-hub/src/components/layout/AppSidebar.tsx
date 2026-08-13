import { useState } from 'react';
import type { ElementType } from 'react';
import { BookUser, ClipboardList, FolderOpen, Home, Menu, Users, X } from 'lucide-react';
import { cn } from '@/lib/utils';

type Tab = 'home' | 'contacts' | 'members' | 'documents' | 'construction';

interface SidebarProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  onLogoClick: () => void;
}

const navItems: { id: Tab; label: string; icon: ElementType }[] = [
  { id: 'home', label: 'Accueil', icon: Home },
  { id: 'contacts', label: 'Contacts', icon: BookUser },
  { id: 'members', label: 'Membres', icon: Users },
  { id: 'documents', label: 'Offres / Docs', icon: FolderOpen },
  { id: 'construction', label: 'Suivi chantier', icon: ClipboardList },
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
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-md border border-white/10 bg-black/70 text-white shadow-lg backdrop-blur"
        aria-label="Ouvrir le menu"
      >
        <Menu size={20} />
      </button>

      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <header className="top-navbar">
        <div className="top-navbar-inner">
          <button onClick={onLogoClick} className="flex items-center gap-3 text-left">
            <img src="/icon.jpg" alt="" className="h-10 w-10 rounded-md object-cover ring-1 ring-primary/40" />
            <div>
              <div className="text-lg font-bold tracking-wide text-white">LaRelève</div>
              <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-primary">Hub opérationnel</div>
            </div>
          </button>

          <nav className="flex items-center gap-2">
            {navItems.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => handleNav(id)}
                className={cn(
                  'nav-link',
                  activeTab === id && 'nav-link-active'
                )}
              >
                <Icon size={17} />
                {label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <aside
        className={cn(
          'fixed z-50 top-0 left-0 h-screen w-72 border-r border-white/10 bg-black/85 flex flex-col shrink-0 transition-transform duration-200 backdrop-blur-xl lg:hidden',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex items-center justify-between px-5 py-5 border-b border-white/10">
          <button onClick={onLogoClick} className="flex items-center gap-3 text-xl font-bold text-white tracking-wide">
            <img src="/icon.jpg" alt="" className="h-9 w-9 rounded-md object-cover ring-1 ring-primary/40" />
            LaRelève
          </button>
          <button onClick={() => setMobileOpen(false)} className="text-white/80" aria-label="Fermer le menu">
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
                  ? 'bg-primary text-white'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              )}
            >
              <Icon size={18} />
              {label}
            </button>
          ))}
        </nav>

        <div className="px-6 py-4 border-t border-white/10">
          <p className="text-xs text-white/[0.45]">LaRelève - l'incubateur de MDB</p>
        </div>
      </aside>
    </>
  );
}
