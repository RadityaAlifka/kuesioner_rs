'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { downloadCSV } from '@/lib/exportUtils';

// --- Interfaces & Types ---
interface Response { id: string; created_at: string; nama: string; usia: number; jenis_kelamin: string; pekerjaan: string; jaminan: string; }
interface Answer { id: string; response_id: string; question_id: string; value: string; }
interface Question { id: string; text: string; type: 'scale' | 'yes_no_text'; }

const getErrorMessage = (error: unknown): string => (error && typeof error === 'object' && 'message' in error ? String((error as { message: string }).message) : String(error));
const formatAnswerValue = (value: string): string => {
  try {
    const parsed = JSON.parse(value);
    if (parsed.choice) return parsed.keterangan ? `${parsed.choice} (Ket: ${parsed.keterangan})` : parsed.choice;
  } catch {
    const scaleMap: Record<string, string> = { '1':'Sangat Tdk Puas', '2':'Tdk Puas', '3':'Cukup', '4':'Puas', '5':'Sangat Puas' };
    return scaleMap[value] || value;
  }
  return value;
};

export default function RawDataPage() {
    const params = useParams();
    const questionnaireId = params.idKuesioner as string;

    const [rawResponses, setRawResponses] = useState<Response[]>([]);
    const [rawAnswers, setRawAnswers] = useState<Answer[]>([]);
    const [rawQuestions, setRawQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState<{ key: keyof Response; direction: 'asc' | 'desc' } | null>(null);
    
    const supabase = createClientComponentClient();

    useEffect(() => {
        const fetchData = async () => {
            if (!questionnaireId) return;
            setLoading(true);
            try {
                const [responsesRes, questionsRes, answersRes] = await Promise.all([
                    supabase.from('responses').select('*').eq('questionnaire_id', questionnaireId).order('created_at', { ascending: false }),
                    supabase.from('questions').select('id, text, type').eq('questionnaire_id', questionnaireId),
                    // --- PERBAIKAN DI SINI: Ubah select() menjadi '*' ---
                    supabase.from('answers').select('*'),
                ]);
                
                if (responsesRes.error) throw responsesRes.error;
                if (questionsRes.error) throw questionsRes.error;
                if (answersRes.error) throw answersRes.error;

                const responsesData = responsesRes.data || [];
                setRawResponses(responsesData);
                setRawQuestions(questionsRes.data || []);

                // Filter answers client-side untuk mengurangi beban join di DB
                const responseIds = responsesData.map(r => r.id);
                setRawAnswers((answersRes.data || []).filter(a => responseIds.includes(a.response_id)));

            } catch (err) {
                setError(getErrorMessage(err));
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [questionnaireId, supabase]);

    const handleSort = (key: keyof Response) => {
        const direction = (sortConfig?.key === key && sortConfig.direction === 'asc') ? 'desc' : 'asc';
        setSortConfig({ key, direction });
    };

    const getFilteredAndSortedResponses = useMemo(() => {
        let data = [...rawResponses];
        if (searchTerm) {
            const lowerSearch = searchTerm.toLowerCase();
            data = data.filter(res =>
                res.nama.toLowerCase().includes(lowerSearch) ||
                res.pekerjaan.toLowerCase().includes(lowerSearch) ||
                res.jaminan.toLowerCase().includes(lowerSearch) ||
                res.jenis_kelamin.toLowerCase().includes(lowerSearch)
            );
        }
        if (sortConfig) {
            data.sort((a, b) => {
                if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
                if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return data;
    }, [rawResponses, searchTerm, sortConfig]);

    const exportToCSV = () => {
        const exportData = getFilteredAndSortedResponses.map(response => {
            const answersObject: Record<string, string> = {};
            rawQuestions.forEach(q => {
                const answer = rawAnswers.find(a => a.response_id === response.id && a.question_id === q.id);
                answersObject[q.text] = answer ? formatAnswerValue(answer.value) : 'N/A';
            });
          
            return {
                'Waktu Submit': response.created_at,
                'Nama': response.nama,
                'Usia': response.usia,
                'Jenis Kelamin': response.jenis_kelamin,
                'Pekerjaan': response.pekerjaan,
                'Jaminan': response.jaminan,
                ...answersObject
            };
        });
        downloadCSV(exportData, `data_responden_${new Date().toISOString().slice(0, 10)}.csv`);
    };

    if (loading) return <div className="text-center">Memuat data mentah...</div>;
    if (error) return <div className="text-center text-red-500">Error: {error}</div>;

    return (
        <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Data Mentah Responden</h2>
                <div className="flex items-center space-x-4">
                     <input type="text" placeholder="Cari berdasarkan nama, pekerjaan, dll..." className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                     <button onClick={exportToCSV} className="bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded-md text-sm">
                        Export CSV
                    </button>
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('nama')}>Nama</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('usia')}>Usia</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('jenis_kelamin')}>Jenis Kelamin</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jawaban</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {getFilteredAndSortedResponses.map((response) => (
                            <tr key={response.id}>
                                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-800">{response.nama}</td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{response.usia}</td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{response.jenis_kelamin}</td>
                                <td className="px-4 py-4 text-sm text-gray-500 max-w-lg whitespace-normal">
                                    {rawAnswers.filter(a => a.response_id === response.id)
                                    .map(a => {
                                        const q = rawQuestions.find(q => q.id === a.question_id);
                                        return `(${q?.text || '?'}: ${formatAnswerValue(a.value)})`;
                                    }).join('; ')}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}