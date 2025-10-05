'use client';

import { useState, useEffect, createContext, useContext } from 'react';
import Link from 'next/link';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { format } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { Calendar as CalendarIcon, LayoutDashboard, Users, PieChart, Database, MessageSquare, ChevronsUpDown, Check, LogOut, Menu, X, Filter } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { Button } from '@/components/ui/button';
import 'react-day-picker/dist/style.css';


// --- Tipe Data untuk Konteks Filter ---
interface FilterContextType {
  dateRange: DateRange | undefined;
  setDateRange: (range: DateRange | undefined) => void;
  jenisKelamin: string; setJenisKelamin: (val: string) => void;
  pekerjaan: string; setPekerjaan: (val: string) => void;
  jaminan: string; setJaminan: (val: string) => void;
  pekerjaanOptions: string[];
  jaminanOptions: string[];
}


// --- Konteks untuk Filter ---
const FilterContext = createContext<FilterContextType>({
  dateRange: undefined,
  setDateRange: () => {},
  jenisKelamin: 'Semua', setJenisKelamin: () => {},
  pekerjaan: 'Semua', setPekerjaan: () => {},
  jaminan: 'Semua', setJaminan: () => {},
  pekerjaanOptions: [],
  jaminanOptions: [],
});

export const useFilter = () => useContext(FilterContext);

interface Questionnaire { id: string; name: string; }

// --- Komponen Layout Utama ---
export default function DashboardLayout({ children }: { children: React.ReactNode; }) {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const idKuesioner = params.idKuesioner as string;

  // State untuk filter
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(new Date().setMonth(new Date().getMonth() - 1)),
    to: new Date(),
  });
  const [jenisKelamin, setJenisKelamin] = useState('Semua');
  const [pekerjaan, setPekerjaan] = useState('Semua');
  const [jaminan, setJaminan] = useState('Semua');
  
  const [pekerjaanOptions, setPekerjaanOptions] = useState<string[]>([]);
  const [jaminanOptions, setJaminanOptions] = useState<string[]>([]);

  const [allQuestionnaires, setAllQuestionnaires] = useState<Questionnaire[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(true);
  const [isClient, setIsClient] = useState(false);

  const supabase = createClientComponentClient();

  useEffect(() => {
    setIsClient(true);

    const fetchDropdownData = async () => {
      const { data: qData } = await supabase.from('questionnaires').select('id, name');
      if (qData) setAllQuestionnaires(qData);

      const { data: pData } = await supabase.from('responses').select('pekerjaan').neq('pekerjaan', '');
      if (pData) setPekerjaanOptions([...new Set(pData.map(item => item.pekerjaan).filter(Boolean))]);
      
      const { data: jData } = await supabase.from('responses').select('jaminan').neq('jaminan', '');
      if (jData) setJaminanOptions([...new Set(jData.map(item => item.jaminan).filter(Boolean))]);
    };
    fetchDropdownData();
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
    { href: `/admin/dashboard/${idKuesioner}/saran`, label: 'Saran Masuk', icon: MessageSquare },
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
                <Link href={item.href} onClick={() => setIsSidebarOpen(false)} className={`flex items-center p-2 rounded-lg transition-colors ${isActive ? 'bg-primary text-primary-foreground' : 'text-gray-600 hover:bg-gray-100'}`}>
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
    <FilterContext.Provider value={{ dateRange, setDateRange, jenisKelamin, setJenisKelamin, pekerjaan, setPekerjaan, jaminan, setJaminan, pekerjaanOptions, jaminanOptions }}>
      <div className="flex min-h-screen bg-gray-50">
        <aside className="w-64 flex-shrink-0 bg-white border-r hidden md:block">
          <SidebarContent />
        </aside>

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
          <header className="bg-white shadow-sm border-b sticky top-0 z-20">
            <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center gap-2">
                <div className="flex items-center gap-2">
                    <button onClick={() => setIsSidebarOpen(true)} className="md:hidden mr-2 text-gray-500 hover:text-gray-700">
                        <Menu className="h-6 w-6" />
                    </button>
                    {isClient && (
                      <div className="relative">
                          <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)} className="flex items-center justify-between w-48 md:w-64 p-2 bg-gray-50 border rounded-md text-left">
                              <span className="font-semibold text-gray-700 truncate">{currentQuestionnaire?.name || 'Memuat...'}</span>
                              <ChevronsUpDown className="h-5 w-5 text-gray-400 flex-shrink-0" />
                          </button>
                          {isDropdownOpen && (
                              <div className="absolute mt-1 w-64 bg-white border rounded-md shadow-lg z-20">
                                  <ul>
                                      {allQuestionnaires.map(q => (
                                          <li key={q.id}>
                                              <Link href={`/admin/dashboard/${q.id}`} className="flex items-center justify-between w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                                                  <span>{q.name}</span>
                                                  {q.id === idKuesioner && <Check className="h-4 w-4 text-primary" />}
                                              </Link>
                                          </li>
                                      ))}
                                  </ul>
                              </div>
                          )}
                      </div>
                    )}
                </div>
              
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
                        <Filter className="h-4 w-4 mr-2" />
                        {showFilters ? 'Sembunyikan' : 'Tampilkan'} Filter
                    </Button>
                    <button onClick={handleLogout} className="flex items-center text-sm font-medium text-gray-600 hover:text-primary p-2 rounded-md">
                        <LogOut className="h-5 w-5 md:mr-2" />
                        <span className="hidden md:inline">Logout</span>
                    </button>
                </div>
            </div>
          </header>

          {showFilters && isClient && (
            <div className="bg-white border-b px-4 sm:px-6 lg:px-8 py-3">
                <div className="flex items-center gap-2 flex-wrap">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant={"outline"} className={cn("w-auto justify-start text-left font-normal", !dateRange && "text-muted-foreground")}>
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dateRange?.from ? (
                            dateRange.to ? (
                              <>
                                {format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}
                              </>
                            ) : (
                              format(dateRange.from, "LLL dd, y")
                            )
                          ) : (
                            <span>Pilih tanggal</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          initialFocus
                          mode="range"
                          defaultMonth={dateRange?.from}
                          selected={dateRange}
                          onSelect={setDateRange}
                          numberOfMonths={2}
                        />
                      </PopoverContent>
                    </Popover>

                      <select value={jaminan} onChange={(e) => setJaminan(e.target.value)} className="rounded-md border-gray-300 text-sm shadow-sm focus:border-primary focus:ring-primary"><option value="Semua">Semua Jaminan</option>{jaminanOptions.map(j => <option key={j} value={j}>{j}</option>)}</select>
                </div>
            </div>
          )}

          <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </FilterContext.Provider>
  );
}