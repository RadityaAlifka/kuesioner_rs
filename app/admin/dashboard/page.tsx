'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface Questionnaire {
    id: string;
    name: string;
    description: string;
}

export default function DashboardSelectionPage() {
    const [questionnaires, setQuestionnaires] = useState<Questionnaire[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClientComponentClient();

    useEffect(() => {
        const fetchQuestionnaires = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from('questionnaires')
                .select('*');

            if (error) {
                console.error('Error fetching questionnaires:', error);
            } else {
                setQuestionnaires(data || []);
            }
            setLoading(false);
        };
        fetchQuestionnaires();
    }, [supabase]);

    if (loading) {
        return <div className="flex min-h-screen items-center justify-center">Memuat daftar kuesioner...</div>;
    }

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-800 mb-6">Pilih Dashboard</h1>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {questionnaires.map((q) => (
                        <Link key={q.id} href={`/admin/dashboard/${q.id}`} legacyBehavior>
                            <a className="block p-6 bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow">
                                <h2 className="text-xl font-semibold text-primary mb-2">{q.name}</h2>
                                <p className="text-gray-600">{q.description}</p>
                            </a>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}