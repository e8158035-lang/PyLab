import React from 'react';
import {
  LayoutDashboard,
  Code2,
  Terminal,
  Package,
  FolderTree,
  Globe,
  BookOpen,
  GraduationCap,
  Cpu,
  Settings,
} from 'lucide-react';
import type { AppView } from '../types/pylab';

interface SidebarNavProps {
  activeView: AppView;
  onSelectView: (view: AppView) => void;
  language: 'ar' | 'en';
}

interface NavItem {
  id: AppView;
  label: string;
  labelAr: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', labelAr: 'الرئيسية', icon: LayoutDashboard },
  { id: 'editor', label: 'Code Editor', labelAr: 'المحرر', icon: Code2 },
  { id: 'explorer', label: 'Projects & Files', labelAr: 'المشاريع', icon: FolderTree },
  { id: 'terminal', label: 'Terminal', labelAr: 'الطرفية', icon: Terminal },
  { id: 'packages', label: 'Packages (pip)', labelAr: 'المكتبات', icon: Package },
  { id: 'servers', label: 'Web Servers', labelAr: 'السيرفرات', icon: Globe },
  { id: 'examples', label: 'Examples', labelAr: 'الأمثلة', icon: BookOpen },
  { id: 'learning', label: 'Learning Center', labelAr: 'مركز التعلم', icon: GraduationCap },
  { id: 'runtime', label: 'Runtime', labelAr: 'البيئة', icon: Cpu },
  { id: 'settings', label: 'Settings', labelAr: 'الإعدادات', icon: Settings },
];

export const SidebarNav: React.FC<SidebarNavProps> = ({ activeView, onSelectView, language }) => {
  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-56 shrink-0 border-r border-slate-200 dark:border-[#23283B] bg-white dark:bg-[#121521] select-none">
        <div className="px-4 py-4 border-b border-slate-200 dark:border-[#23283B] flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center text-white font-display font-bold text-sm shrink-0">
            Py
          </div>
          <span className="font-display font-bold text-base tracking-tight text-slate-900 dark:text-white whitespace-nowrap">
            PyLab Studio
          </span>
        </div>

        <nav className="flex-1 p-2.5 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectView(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
                  active
                    ? 'bg-violet-600 text-white'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#191D2D] hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{language === 'ar' ? item.labelAr : item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-3 border-t border-slate-200 dark:border-[#23283B] text-xs text-slate-500 dark:text-slate-400">
          Python 3.11 · Local IDE
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t border-slate-200 dark:border-[#23283B] bg-white/95 dark:bg-[#121521]/95 backdrop-blur flex items-center justify-around px-1 py-1 overflow-x-auto">
        {NAV_ITEMS.slice(0, 6).map((item) => {
          const Icon = item.icon;
          const active = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectView(item.id)}
              className={`flex flex-col items-center justify-center min-w-[54px] min-h-[44px] px-2 py-1 rounded-md text-[11px] font-medium transition-colors whitespace-nowrap shrink-0 ${
                active ? 'text-violet-600 dark:text-violet-400' : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <Icon className="w-4 h-4 mb-0.5" />
              <span>{language === 'ar' ? item.labelAr : item.label.split(' ')[0]}</span>
            </button>
          );
        })}
        <button
          onClick={() => onSelectView(activeView === 'learning' ? 'settings' : 'learning')}
          className={`flex flex-col items-center justify-center min-w-[54px] min-h-[44px] px-2 py-1 rounded-md text-[11px] font-medium whitespace-nowrap shrink-0 ${
            activeView === 'learning' || activeView === 'settings'
              ? 'text-violet-600 dark:text-violet-400'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <GraduationCap className="w-4 h-4 mb-0.5" />
          <span>{language === 'ar' ? 'التعلم' : 'Learn'}</span>
        </button>
      </nav>
    </>
  );
};
