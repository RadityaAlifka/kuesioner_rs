'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useFilter } from '../layout';
import { format } from 'date-fns';

interface Suggestion {
  id: string;
  created_at: string;
  nama: string;
  saran: string;
}

const getErrorMessage = (error: unknown): string => (error && typeof error === 'object' && 'message' in error ? String((error as { message: string }).message) : String(error));

export default function SaranPage() {
    const params = useParams();
    const questionnaireId = params.idKuesioner as string;
    const { dateRange, jenisKelamin, pekerjaan, jaminan } = useFilter();

    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const supabase = createClientComponentClient();

    useEffect(() => {
        const fetchSuggestions = async () => {
            if (!questionnaireId || !dateRange?.from || !dateRange?.to) return;
            setLoading(true);
            try {
                const endDatePlusOne = new Date(dateRange.to);
                endDatePlusOne.setDate(endDatePlusOne.getDate() + 1);

                let query = supabase
                    .from('responses')
                    .select('id, created_at, nama, saran')
                    .eq('questionnaire_id', questionnaireId)
                    .not('saran', 'is', null)
                    .neq('saran', '')
                    .gte('created_at', format(dateRange.from, 'yyyy-MM-dd'))
                    .lt('created_at', format(endDatePlusOne, 'yyyy-MM-dd'))
                    .order('created_at', { ascending: false });

                if (jenisKelamin !== 'Semua') query = query.eq('jenis_kelamin', jenisKelamin);
                if (pekerjaan !== 'Semua') query = query.eq('pekerjaan', pekerjaan);
                if (jaminan !== 'Semua') query = query.eq('jaminan', jaminan);

                const { data, error } = await query;
                
                if (error) throw error;
                setSuggestions(data || []);
            } catch (err) {
                setError(getErrorMessage(err));
            } finally {
                setLoading(false);
            }
        };
        fetchSuggestions();
    }, [questionnaireId, supabase, dateRange, jenisKelamin, pekerjaan, jaminan]);

    if (loading) return <div className="text-center">Memuat saran...</div>;
    if (error) return <div className="text-center text-red-500">Error: {error}</div>;

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-800">Saran & Masukan Responden</h1>
            {suggestions.length === 0 ? (
                <div className="bg-white p-6 rounded-lg shadow-md text-center">
                    <p className="text-gray-500">Belum ada saran yang masuk untuk filter yang dipilih.</p>
                </div>
            ) : (
                suggestions.map(s => (
                    <div key={s.id} className="bg-white p-6 rounded-lg shadow-md border-l-4 border-primary">
                        <p className="text-gray-700 italic">"{s.saran}"</p>
                        <div className="mt-4 text-sm text-gray-500 flex justify-between items-center">
                            <span>Oleh: <strong>{s.nama}</strong></span>
                            <span>{new Date(s.created_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                        </div>
                    </div>
                ))
            )}
        </div>
    );
}