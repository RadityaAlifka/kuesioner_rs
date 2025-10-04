'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { ChevronRight, FileText } from 'lucide-react';
import Image from 'next/image';

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
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-primary"></div>
                    <p className="mt-4 text-muted-foreground">Memuat daftar kuesioner...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 sm:py-12">
                <div className="text-center mb-10">
                    <Image src="/images/logo.jpg" alt="Logo" width={100} height={100} className="mx-auto mb-4" />
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Pilih Dashboard</h1>
                    <p className="mt-2 text-lg text-gray-600">Pilih salah satu kuesioner untuk melihat hasil analisisnya.</p>
                </div>
                
                <div className="space-y-6">
                    {questionnaires.map((q) => (
                        <Link 
                            key={q.id} 
                            href={`/admin/dashboard/${q.id}`} 
                            className="group block bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                        >
                            <div className="flex items-center justify-between p-6">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0 bg-primary/10 text-primary p-3 rounded-lg">
                                        <FileText className="h-6 w-6" />
                                    </div>
                                    <div className="ml-5">
                                        <h2 className="text-xl font-semibold text-gray-800 group-hover:text-primary transition-colors">{q.name}</h2>
                                        <p className="text-gray-600 text-sm mt-1">{q.description}</p>
                                    </div>
                                </div>
                                <div className="ml-4">
                                    <ChevronRight className="h-6 w-6 text-gray-400 group-hover:text-primary transition-all group-hover:translate-x-1" />
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}