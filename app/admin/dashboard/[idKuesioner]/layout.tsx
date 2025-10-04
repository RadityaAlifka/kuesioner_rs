'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { LayoutDashboard, Users, PieChart, Database, ChevronsUpDown, Check, LogOut, Menu, X } from 'lucide-react';

interface Questionnaire {
  id: string;
  name: string;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const idKuesioner = params.idKuesioner as string;

  const [allQuestionnaires, setAllQuestionnaires] = useState<Questionnaire[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // State untuk sidebar mobile
  const supabase = createClientComponentClient();

  useEffect(() => {
    const fetchQuestionnaires = async () => {
      const { data } = await supabase.from('questionnaires').select('id, name');
      if (data) {
        setAllQuestionnaires(data);
      }
    };
    fetchQuestionnaires();
  }, [supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/admin/login');
  };

  const navItems = [
    { href: `/admin/dashboard/${idKuesioner}`, label: 'Overview', icon: LayoutDashboard },
    { href: `/admin/dashboard/${idKuesioner}/demographics`, label: 'Demografi', icon: Users },
    { href: `/admin/dashboard/${idKuesioner}/details`, label: 'Detail Jawaban', icon: PieChart },
    { href: `/admin/dashboard/${idKuesioner}/raw-data`, label: 'Data Mentah', icon: Database },
  ];

  const currentQuestionnaire = allQuestionnaires.find(q => q.id === idKuesioner);

  const SidebarContent = () => (
    <>
      <div className="h-16 flex items-center justify-center border-b">
        <Link href="/admin/dashboard" className="text-xl font-bold text-primary">Dashboard</Link>
      </div>
      <nav className="mt-6">
        <ul>
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.label} className="px-4 py-1">
                <Link href={item.href} onClick={() => setIsSidebarOpen(false)} className={`flex items-center p-2 rounded-lg transition-colors ${
                    isActive ? 'bg-primary text-primary-foreground' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <item.icon className="h-5 w-5 mr-3" />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar untuk Desktop */}
      <aside className="w-64 flex-shrink-0 bg-white border-r hidden md:block">
        <SidebarContent />
      </aside>

      {/* Sidebar untuk Mobile */}
      {isSidebarOpen && (
        <div className="fixed inset-0 flex z-40 md:hidden">
          <div className="fixed inset-0 bg-black opacity-30" onClick={() => setIsSidebarOpen(false)}></div>
          <aside className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button onClick={() => setIsSidebarOpen(false)} className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white">
                <X className="h-6 w-6 text-white" />
              </button>
            </div>
            <SidebarContent />
          </aside>
        </div>
      )}

      <div className="flex-1 flex flex-col">
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center">
            {/* Tombol Hamburger Menu untuk Mobile */}
            <button onClick={() => setIsSidebarOpen(true)} className="md:hidden mr-4 text-gray-500 hover:text-gray-700">
              <Menu className="h-6 w-6" />
            </button>
            
            <div className="relative">
              <button 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)} 
                onBlur={() => setTimeout(() => setIsDropdownOpen(false), 150)}
                className="flex items-center justify-between w-48 md:w-64 p-2 bg-gray-50 border rounded-md text-left"
              >
                <span className="font-semibold text-gray-700 truncate">{currentQuestionnaire?.name || 'Memuat...'}</span>
                <ChevronsUpDown className="h-5 w-5 text-gray-400 flex-shrink-0" />
              </button>
              {isDropdownOpen && (
                <div className="absolute mt-1 w-64 bg-white border rounded-md shadow-lg z-20">
                  <ul>
                    {allQuestionnaires.map(q => (
                      <li key={q.id}>
                        <Link 
                          href={`/admin/dashboard/${q.id}`} 
                          onClick={() => setIsDropdownOpen(false)}
                          className="flex items-center justify-between w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <span>{q.name}</span>
                          {q.id === idKuesioner && <Check className="h-4 w-4 text-primary" />}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            
            <button onClick={handleLogout} className="flex items-center text-sm font-medium text-gray-600 hover:text-primary">
                <LogOut className="h-5 w-5 md:mr-2" />
                <span className="hidden md:inline">Logout</span>
            </button>
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}