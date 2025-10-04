'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface DashboardStats { jenis_kelamin: Record<string, number>; rentang_usia: Record<string, number>; pekerjaan: Record<string, number>; jaminan: Record<string, number>; }
const getErrorMessage = (error: unknown): string => (error && typeof error === 'object' && 'message' in error ? String((error as { message: string }).message) : String(error));

export default function DemographicsPage() {
    const params = useParams();
    const questionnaireId = params.idKuesioner as string;

    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const supabase = createClientComponentClient();

    useEffect(() => {
        const fetchStats = async () => {
            if (!questionnaireId) return;
            setLoading(true);
            const { data, error } = await supabase.rpc('get_dashboard_stats', { p_questionnaire_id: questionnaireId });
            if (error) setError(getErrorMessage(error));
            else setStats(data);
            setLoading(false);
        };
        fetchStats();
    }, [questionnaireId, supabase]);

    const demographicCharts = useMemo(() => {
        if (!stats) return [];
        return [
          { title: 'Jenis Kelamin', data: Object.entries(stats.jenis_kelamin || {}).map(([name, value]) => ({ name, value })) },
          { title: 'Rentang Usia', data: Object.entries(stats.rentang_usia || {}).map(([name, value]) => ({ name, value })) },
          { title: 'Pekerjaan', data: Object.entries(stats.pekerjaan || {}).map(([name, value]) => ({ name, value })) },
          { title: 'Jaminan', data: Object.entries(stats.jaminan || {}).map(([name, value]) => ({ name, value })) },
        ];
    }, [stats]);

    if (loading) return <div className="text-center">Memuat data demografi...</div>;
    if (error) return <div className="text-center text-red-500">Error: {error}</div>;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {demographicCharts.map(({ title, data }) => (
                <div key={title} className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">{title}</h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data} layout="vertical" margin={{ left: 80 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" />
                                <YAxis type="category" dataKey="name" width={80} interval={0} fontSize={12} />
                                <Tooltip />
                                <Bar dataKey="value" name="Jumlah" fill="#3b82f6" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            ))}
        </div>
    );
}