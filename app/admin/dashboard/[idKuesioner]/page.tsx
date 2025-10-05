'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { useFilter } from './layout';
import { format } from 'date-fns';

interface DashboardStats { total_responden: number; }
interface HeatmapData { question_id: string; pertanyaan: string; sangat_tidak_puas: number; tidak_puas: number; cukup_puas: number; puas: number; sangat_puas: number; }
interface Question { id: string; type: 'scale' | 'yes_no_text'; }

const getErrorMessage = (error: unknown): string => (error && typeof error === 'object' && 'message' in error ? String((error as { message: string }).message) : String(error));

export default function OverviewPage() {
  const params = useParams();
  const questionnaireId = params.idKuesioner as string;
  const { dateRange, jenisKelamin, pekerjaan, jaminan } = useFilter();

  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [heatmapData, setHeatmapData] = useState<HeatmapData[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClientComponentClient();

  useEffect(() => {
    const fetchData = async () => {
      if (!questionnaireId || !dateRange?.from || !dateRange?.to) return;
      setLoading(true);
      setError(null);
      
      const filters = {
        p_questionnaire_id: questionnaireId,
        start_date: format(dateRange.from, 'yyyy-MM-dd'),
        end_date: format(dateRange.to, 'yyyy-MM-dd'),
        p_jenis_kelamin: jenisKelamin === 'Semua' ? null : jenisKelamin,
        p_pekerjaan: pekerjaan === 'Semua' ? null : pekerjaan,
        p_jaminan: jaminan === 'Semua' ? null : jaminan,
      };

      try {
        const [statsRes, heatmapRes, questionsRes] = await Promise.all([
          supabase.rpc('get_dashboard_stats', filters),
          supabase.rpc('get_heatmap_summary', filters),
          supabase.from('questions').select('id, type').eq('questionnaire_id', questionnaireId)
        ]);
        
        if (statsRes.error) throw statsRes.error;
        if (heatmapRes.error) throw heatmapRes.error;
        if (questionsRes.error) throw questionsRes.error;

        setDashboardStats(statsRes.data);
        setHeatmapData(heatmapRes.data || []);
        setQuestions(questionsRes.data || []);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [questionnaireId, supabase, dateRange, jenisKelamin, pekerjaan, jaminan]);

  const radarChartData = useMemo(() => {
    if (!heatmapData.length || !questions.length) return [];
    return heatmapData
      .filter(q => questions.find(rq => rq.id === q.question_id)?.type === 'scale')
      .map(row => {
        const totalScore = (row.sangat_tidak_puas * 1) + (row.tidak_puas * 2) + (row.cukup_puas * 3) + (row.puas * 4) + (row.sangat_puas * 5);
        const totalVotes = row.sangat_tidak_puas + row.tidak_puas + row.cukup_puas + row.puas + row.sangat_puas;
        const average = totalVotes > 0 ? totalScore / totalVotes : 0;
        return {
          subject: row.pertanyaan,
          score: parseFloat(average.toFixed(2)),
          fullMark: 5,
        };
      });
  }, [heatmapData, questions]);

  if (loading) return <div className="text-center">Memuat overview...</div>;
  if (error) return <div className="text-center text-red-500">Error: {error}</div>;

  return (
    <div className="space-y-8">
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900">Total Responden</h3>
        <p className="mt-2 text-3xl font-bold text-primary">{dashboardStats?.total_responden || 0}</p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Profil Kepuasan Responden (Radar)</h2>
        <p className="text-sm text-gray-500 mb-4">Setiap sumbu mewakili satu pertanyaan. Semakin lebar area hijau, semakin tinggi tingkat kepuasan secara keseluruhan.</p>
        <div className="h-[500px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarChartData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 5]} />
                    <Radar name="Skor Rata-Rata" dataKey="score" stroke="#16a34a" fill="#16a34a" fillOpacity={0.6} />
                    <Tooltip />
                    <Legend />
                </RadarChart>
            </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}