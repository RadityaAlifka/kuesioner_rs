'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'; 
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { downloadCSV } from '@/lib/exportUtils'; // Asumsi Anda punya helper ini

// --- INTERFACES ---
interface Response {
  id: string;
  created_at: string;
  usia: number;
  jenis_kelamin: string;
}

interface Answer {
  id: string;
  response_id: string;
  question_id: string;
  value: string;
  created_at: string;
}

interface Question {
  id: string;
  text: string;
}

interface QuestionSummary {
  question_id: string;
  pertanyaan: string;
  label_jawaban: string;
  jumlah_jawaban: number;
}

interface DashboardStats {
  total_responden: number;
  jenis_kelamin: Record<string, number>;
  rentang_usia: Record<string, number>;
}

interface ErrorWithMessage {
  message: string;
}

// --- HELPER FUNCTIONS ---
function isErrorWithMessage(error: unknown): error is ErrorWithMessage {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as Record<string, unknown>).message === 'string'
  );
}

function getErrorMessage(error: unknown) {
  if (isErrorWithMessage(error)) {
    return error.message;
  }
  return String(error);
}

// --- CONSTANTS ---
const COLORS = ['#f25022', '#3498db', '#2ecc71', '#9b59b6', '#f1c40f', '#e74c3c'];

// --- COMPONENT ---
export default function DashboardPage() {
  const [rawResponses, setRawResponses] = useState<Response[]>([]);
  const [rawAnswers, setRawAnswers] = useState<Answer[]>([]);
  const [rawQuestions, setRawQuestions] = useState<Question[]>([]);
  
  const [questionChartData, setQuestionChartData] = useState<QuestionSummary[]>([]);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState<boolean>(false);
  
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortConfig, setSortConfig] = useState<{ key: keyof Response; direction: 'asc' | 'desc' } | null>(null);

  const dashboardRef = useRef<HTMLDivElement>(null);
  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const [responsesRes, answersRes, questionsRes, summaryRes, statsRes] = await Promise.all([
        supabase.from('responses').select('*').order('created_at', { ascending: false }),
        supabase.from('answers').select('*'),
        supabase.from('questions').select('*'),
        supabase.rpc('get_questionnaire_summary'),
        supabase.rpc('get_dashboard_stats')
      ]);

      if (responsesRes.error) throw responsesRes.error;
      if (answersRes.error) throw answersRes.error;
      if (questionsRes.error) throw questionsRes.error;
      if (summaryRes.error) throw summaryRes.error;
      if (statsRes.error) throw statsRes.error;

      setRawResponses(responsesRes.data || []);
      setRawAnswers(answersRes.data || []);
      setRawQuestions(questionsRes.data || []);
      setQuestionChartData(summaryRes.data || []);
      setDashboardStats(statsRes.data);

    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };
  
  const totalResponden = dashboardStats?.total_responden || 0;
  
  const jenisKelaminData = useMemo(() => {
    if (!dashboardStats) return [];
    return Object.entries(dashboardStats.jenis_kelamin).map(([name, value]) => ({ name, value }));
  }, [dashboardStats]);

  const usiaData = useMemo(() => {
    if (!dashboardStats) return [];
    return Object.entries(dashboardStats.rentang_usia).map(([name, value]) => ({ name, value }));
  }, [dashboardStats]);

  const processedChartData = useMemo(() => {
    if (!questionChartData) return [];
    const groupedData = questionChartData.reduce((acc, item) => {
      if (!acc[item.question_id]) {
        acc[item.question_id] = { questionText: item.pertanyaan, data: [] };
      }
      acc[item.question_id].data.push({ name: item.label_jawaban, value: item.jumlah_jawaban });
      return acc;
    }, {} as Record<string, { questionText: string; data: { name: string; value: number }[] }>);
    return Object.values(groupedData);
  }, [questionChartData]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/admin/login';
  };

  const handleSaveAsPDF = async () => {
    const content = dashboardRef.current;
    if (!content) return;
    setIsGeneratingPDF(true);
    try {
      const canvas = await html2canvas(content, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: [canvas.width, canvas.height] });
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save(`laporan-dashboard-${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (err) {
      console.error("Gagal membuat PDF:", err);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const exportRespondenToCSV = () => {
    const exportData = rawResponses.map(response => {
      const responseAnswers = rawAnswers
        .filter(answer => answer.response_id === response.id)
        .map(answer => {
          const question = rawQuestions.find(q => q.id === answer.question_id);
          return question ? `${question.text}: ${answer.value}` : answer.value;
        }).join('; ');
      return { id: response.id, created_at: response.created_at, usia: response.usia, jenis_kelamin: response.jenis_kelamin, jawaban: responseAnswers };
    });
    downloadCSV(exportData, `data_responden_${new Date().toISOString().slice(0, 10)}.csv`);
  };

  const handleSort = (key: keyof Response) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig?.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getFilteredAndSortedResponses = () => {
    let filteredData = rawResponses;
    if (searchTerm) {
      filteredData = filteredData.filter(response => 
        response.usia.toString().includes(searchTerm) || 
        response.jenis_kelamin.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (sortConfig) {
      filteredData = [...filteredData].sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
        if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return filteredData;
  };

  if (loading || !dashboardStats) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
          <div className="text-red-500 text-5xl mb-4">✕</div>
          <h1 className="text-xl font-bold text-gray-800 mb-2">Error Mengambil Data</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button onClick={() => window.location.reload()} className="bg-orange-500 hover:bg-orange-600 text-white font-medium py-2 px-4 rounded-md">
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-xl font-semibold text-gray-900">Dashboard Admin</h1>
          <div className="flex space-x-4">
            <button onClick={handleSaveAsPDF} disabled={isGeneratingPDF} className={`bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-md ${isGeneratingPDF ? 'opacity-50 cursor-not-allowed' : ''}`}>
              {isGeneratingPDF ? 'Menyimpan...' : 'Simpan PDF'}
            </button>
            <button onClick={exportRespondenToCSV} className="bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded-md">
              Export CSV
            </button>
            <button onClick={handleLogout} className="bg-orange-500 hover:bg-orange-600 text-white font-medium py-2 px-4 rounded-md">
              Logout
            </button>
          </div>
        </div>
      </header>

      <main ref={dashboardRef} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistik Utama */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900">Total Responden</h3>
            <p className="mt-2 text-3xl font-bold text-orange-500">{totalResponden}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900">Jenis Kelamin</h3>
            <ul className="mt-2">
              {jenisKelaminData.map((item) => (<li key={item.name} className="flex justify-between"><span>{item.name}:</span><span className="font-medium">{item.value}</span></li>))}
            </ul>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900">Rentang Usia</h3>
            <ul className="mt-2">
              {usiaData.map((item) => (<li key={item.name} className="flex justify-between"><span>{item.name}:</span><span className="font-medium">{item.value}</span></li>))}
            </ul>
          </div>
        </div>

        {/* Chart Demografi */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Distribusi Jenis Kelamin</h2>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                      <PieChart><Pie data={jenisKelaminData} cx="50%" cy="50%" labelLine={false} outerRadius={100} fill="#8884d8" dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>{jenisKelaminData.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}</Pie><Tooltip /><Legend verticalAlign="bottom" height={36}/></PieChart>
                  </ResponsiveContainer>
                </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Distribusi Rentang Usia</h2>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={usiaData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis /><Tooltip /><Legend /><Bar dataKey="value" name="Jumlah Responden" fill="#f25022" /></BarChart>
                  </ResponsiveContainer>
                </div>
            </div>
        </div>

        {/* Visualisasi Jawaban per Pertanyaan */}
        <div className="mt-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Visualisasi Jawaban per Pertanyaan</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {processedChartData.map((chartItem, index) => (
                    <div key={index} className="bg-white p-6 rounded-lg shadow">
                        <h3 className="text-md font-medium text-gray-900 mb-4 truncate" title={chartItem.questionText}>{chartItem.questionText}</h3>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={chartItem.data} cx="50%" cy="50%" labelLine={false} outerRadius={80} fill="#8884d8" dataKey="value" label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}>{chartItem.data.map((entry, idx) => (<Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />))}</Pie>
                                    <Tooltip formatter={(value, name) => [`${value} responden`, name]} />
                                    <Legend verticalAlign="bottom" />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                ))}
            </div>
        </div>

        {/* Tabel Jawaban Responden */}
        <div className="mt-8 bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium text-gray-900">Data Mentah Responden</h2>
            <input type="text" placeholder="Cari berdasarkan usia atau jenis kelamin..." className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('usia')}>Usia {sortConfig?.key === 'usia' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('jenis_kelamin')}>Jenis Kelamin {sortConfig?.key === 'jenis_kelamin' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jawaban</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {getFilteredAndSortedResponses().map((response, index) => {
                  const responseAnswers = rawAnswers.filter(answer => answer.response_id === response.id).map(answer => {
                      const question = rawQuestions.find(q => q.id === answer.question_id);
                      return question ? `${question.text}: ${answer.value}` : answer.value;
                    }).join('; ');
                  return (
                    <tr key={response.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{index + 1}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{response.usia}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{response.jenis_kelamin}</td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-md">{responseAnswers}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}