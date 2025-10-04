'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

// --- Interfaces & Types ---
interface Question { id: string; text: string; label: string; urutan: number; type: 'scale' | 'yes_no_text'; }
interface QuestionSummary { question_id: string; pertanyaan: string; label_jawaban: string; jumlah_jawaban: number; }

// --- Helpers & Constants ---
const COLORS: Record<string, string> = { "Sangat Puas": '#16a34a', "Puas": '#84cc16', "Cukup Puas": '#facc15', "Tidak Puas": '#fb923c', "Sangat Tidak Puas": '#ef4444', "Ya": '#16a34a', "Tidak": '#ef4444' };
const getErrorMessage = (error: unknown): string => (error && typeof error === 'object' && 'message' in error ? String((error as { message: string }).message) : String(error));

export default function DetailsPage() {
    const params = useParams();
    const questionnaireId = params.idKuesioner as string;

    const [questionSummary, setQuestionSummary] = useState<QuestionSummary[]>([]);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const supabase = createClientComponentClient();

    useEffect(() => {
        const fetchData = async () => {
            if (!questionnaireId) return;
            setLoading(true);
            try {
                const [summaryRes, questionsRes] = await Promise.all([
                    supabase.rpc('get_questionnaire_summary', { p_questionnaire_id: questionnaireId }),
                    supabase.from('questions').select('*').eq('questionnaire_id', questionnaireId).order('urutan')
                ]);

                if (summaryRes.error) throw summaryRes.error;
                if (questionsRes.error) throw questionsRes.error;

                setQuestionSummary(summaryRes.data || []);
                setQuestions(questionsRes.data || []);
            } catch (err) {
                setError(getErrorMessage(err));
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [questionnaireId, supabase]);

    const groupedQuestionCharts = useMemo(() => {
        if (!questionSummary.length || !questions.length) return [];
        const questionsByLabel = questions.reduce((acc, q) => {
            if (!acc[q.label]) acc[q.label] = [];
            acc[q.label].push(q);
            return acc;
        }, {} as Record<string, Question[]>);

        return Object.entries(questionsByLabel).map(([label, questions]) => ({
            label,
            charts: questions.map(q => {
                const data = questionSummary
                    .filter(item => item.question_id === q.id)
                    .map(item => ({ name: item.label_jawaban, value: item.jumlah_jawaban }));
                return { questionText: q.text, type: q.type, data };
            })
        }));
    }, [questionSummary, questions]);

    if (loading) return <div className="text-center">Memuat detail jawaban...</div>;
    if (error) return <div className="text-center text-red-500">Error: {error}</div>;

    return (
        <div className="space-y-12">
            {groupedQuestionCharts.map(({ label, charts }) => (
                <div key={label}>
                    <h2 className="text-2xl font-semibold text-gray-800 mb-6 border-b-2 border-primary pb-2">{label}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {charts.map((chart) => (
                            <div key={chart.questionText} className="bg-white p-6 rounded-lg shadow">
                                <h3 className="text-md font-medium text-gray-900 mb-4 h-12" title={chart.questionText}>{chart.questionText}</h3>
                                <div className="h-64">
                                    <ResponsiveContainer width="100%" height="100%">
                                        {chart.type === 'scale' ? (
                                            <PieChart>
                                                <Pie data={chart.data} cx="50%" cy="50%" labelLine={false} outerRadius={80} dataKey="value" nameKey="name" label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}>
                                                    {chart.data.map((entry) => <Cell key={`cell-${entry.name}`} fill={COLORS[entry.name] || '#cccccc'} />)}
                                                </Pie>
                                                <Tooltip />
                                                <Legend />
                                            </PieChart>
                                        ) : (
                                            <BarChart data={chart.data} layout="vertical" margin={{ left: 20 }}>
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis type="number" />
                                                <YAxis type="category" dataKey="name" />
                                                <Tooltip />
                                                <Bar dataKey="value" name="Jumlah">
                                                    {chart.data.map((entry) => <Cell key={`cell-${entry.name}`} fill={COLORS[entry.name] || '#cccccc'} />)}
                                                </Bar>
                                            </BarChart>
                                        )}
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}