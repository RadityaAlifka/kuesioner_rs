'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { supabase } from '@/lib/supabaseClient';

// --- Tipe Data ---
interface Question {
  id: string;
  text: string;
  urutan: number;
  label: string;
  type: 'scale' | 'yes_no_text';
}

const scaleOptions = [
  'Sangat Tidak Puas', 
  'Tidak Puas', 
  'Cukup Puas', 
  'Puas', 
  'Sangat Puas'
];

const getErrorMessage = (error: unknown): string => (error && typeof error === 'object' && 'message' in error ? String((error as { message: string }).message) : String(error));

export default function KuesionerPage() {
  const params = useParams();
  const router = useRouter();
  
  const slug = params.namaKuesioner as string;
  const questionnaireName = slug === 'rawat-inap' ? 'Rawat Inap' : 
                          slug === 'rawat-jalan' ? 'Rawat Jalan' : '';

  const [questionnaireId, setQuestionnaireId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [responses, setResponses] = useState<Record<string, any>>({});
  
  const [nama, setNama] = useState<string>('');
  const [usia, setUsia] = useState<string>('');
  const [jenisKelamin, setJenisKelamin] = useState<string>('');
  const [pekerjaan, setPekerjaan] = useState<string>('');
  const [jaminan, setJaminan] = useState<string>('');
  const [saran, setSaran] = useState<string>('');

  const [loading, setLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [isInfoSubmitted, setIsInfoSubmitted] = useState(false);

  useEffect(() => {
    const fetchQuestionnaireData = async () => {
      if (!questionnaireName) {
          router.push('/');
          return;
      }
      setLoading(true);
      try {
        const { data: qData, error: qError } = await supabase.from('questionnaires').select('id').eq('name', questionnaireName).single();
        if (qError || !qData) throw new Error(`Kuesioner "${questionnaireName}" tidak ditemukan.`);
        
        const qId = qData.id;
        setQuestionnaireId(qId);

        const { data: questionsData, error: questionsError } = await supabase.from('questions').select('*').eq('questionnaire_id', qId).eq('aktif', true).order('urutan', { ascending: true });
        if (questionsError) throw questionsError;
        setQuestions(questionsData || []);
      } catch (error) {
        console.error('Error fetching data:', getErrorMessage(error));
        router.push('/');
      } finally {
        setLoading(false);
      }
    };
    fetchQuestionnaireData();
  }, [questionnaireName, router, slug]);

  const pages = useMemo(() => {
    if (questions.length === 0) return [];
    const uniqueLabels = [...new Set(questions.map(q => q.label))];
    const pageList: string[] = [];
    for (const label of uniqueLabels) {
        const questionsInLabel = questions.filter(q => q.label === label);
        if (questionsInLabel.length > 0 && questionsInLabel[0].type === 'yes_no_text') {
            pageList.push(...questionsInLabel.map(q => q.id));
        } else {
            pageList.push(label);
        }
    }
    pageList.push('Saran');
    return pageList;
  }, [questions]);

  const handleScaleChange = (questionId: string, value: string) => {
    setResponses(prev => ({ ...prev, [questionId]: value }));
  };
  
  const handleYesNoTextChange = (questionId: string, part: 'choice' | 'keterangan', value: string) => {
    const existingAnswer = responses[questionId] || { choice: '', keterangan: '' };
    setResponses(prev => ({
      ...prev,
      [questionId]: { ...existingAnswer, [part]: value }
    }));
  };

  const handleNext = () => {
    const currentPage = pages[currentPageIndex];
    if (currentPage !== 'Saran') {
        const isSingleQuestionPage = questions.some(q => q.id === currentPage);
        let questionsToValidate: Question[] = [];
        if (isSingleQuestionPage) {
            questionsToValidate = questions.filter(q => q.id === currentPage);
        } else {
            questionsToValidate = questions.filter(q => q.label === currentPage);
        }
        for (const question of questionsToValidate) {
            const response = responses[question.id];
            if (question.type === 'scale' && !response) {
                alert(`Harap menjawab pertanyaan: "${question.text}"`);
                return;
            }
            if (question.type === 'yes_no_text' && (!response || !response.choice)) {
                alert(`Harap memilih "Ya" atau "Tidak" untuk pertanyaan: "${question.text}"`);
                return;
            }
        }
    }
    if (currentPageIndex < pages.length - 1) {
      setCurrentPageIndex(prevIndex => prevIndex + 1);
    } else {
      handleSubmit();
    }
  };

  const handlePrevious = () => {
    if (currentPageIndex > 0) {
      setCurrentPageIndex(prevIndex => prevIndex - 1);
    } else {
      setIsInfoSubmitted(false);
    }
  };
  
  const handleInfoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (nama && usia && jenisKelamin && pekerjaan && jaminan) {
      setIsInfoSubmitted(true);
    } else {
      alert('Harap lengkapi semua informasi responden.');
    }
  };

  const handleSubmit = async () => {
    if (Object.keys(responses).length < questions.length) {
      alert("Beberapa pertanyaan belum terjawab. Silakan periksa kembali.");
      return;
    }
    setIsSubmitting(true);
    try {
      const { data: responseData, error: responseError } = await supabase
        .from('responses')
        .insert([{ questionnaire_id: questionnaireId, nama, usia: parseInt(usia), jenis_kelamin: jenisKelamin, pekerjaan, jaminan, saran }])
        .select();
      if (responseError) throw responseError;
      if (!responseData || responseData.length === 0) throw new Error('Gagal membuat respons');
      
      const responseId = responseData[0].id;
      const answersToInsert = Object.entries(responses).map(([questionId, value]) => ({
        response_id: responseId,
        question_id: questionId,
        value: typeof value === 'object' ? JSON.stringify(value) : value
      }));
      if (answersToInsert.length > 0) {
        const { error: answersError } = await supabase.from('answers').insert(answersToInsert);
        if (answersError) throw answersError;
      }
      window.location.href = '/thankyou';
    } catch (error) {
      console.error('Error submitting form:', error);
      alert(`Terjadi kesalahan saat mengirim kuesioner: ${getErrorMessage(error)}`);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const progress = pages.length > 0 ? ((currentPageIndex + 1) / pages.length) * 100 : 0;
  
  const currentPageIdentifier = pages[currentPageIndex];
  const isSaranPage = currentPageIdentifier === 'Saran';
  const isSingleQuestionPage = useMemo(() => questions.some(q => q.id === currentPageIdentifier), [questions, currentPageIdentifier]);
  
  let pageContent: Question[] = [];
  let pageLabel = '';

  if (isSaranPage) {
    pageLabel = "Saran & Masukan";
  } else if (currentPageIdentifier) {
    if (isSingleQuestionPage) {
        pageContent = questions.filter(q => q.id === currentPageIdentifier);
        pageLabel = pageContent.length > 0 ? pageContent[0].label : '';
    } else {
        pageContent = questions.filter(q => q.label === currentPageIdentifier);
        pageLabel = currentPageIdentifier;
    }
  }

  if (loading) {
     return (
        <div className="flex min-h-screen items-center justify-center bg-background">
            <div className="text-center">
                <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-primary"></div>
                <p className="mt-4 text-muted-foreground">Memuat pertanyaan...</p>
            </div>
        </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center bg-gray-50 p-4">
      <div className="mx-auto w-full max-w-2xl">
        <div className="mb-8 text-center">
          <Image src="/images/logo.jpg" alt="Logo" width={150} height={150} className="mx-auto" priority />
        </div>

        <div className="rounded-lg bg-card p-6 text-card-foreground shadow-md sm:p-8">
          {!isInfoSubmitted ? (
            <form onSubmit={handleInfoSubmit}>
                <h2 className="mb-6 text-center text-xl font-semibold">Informasi Responden</h2>
                <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div><label htmlFor="nama" className="mb-1 block text-sm font-medium">Nama</label><input type="text" id="nama" value={nama} onChange={(e) => setNama(e.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" required /></div>
                    <div><label htmlFor="usia" className="mb-1 block text-sm font-medium">Usia</label><input type="number" id="usia" value={usia} onChange={(e) => setUsia(e.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" min="1" max="120" required /></div>
                    <div><label htmlFor="jenisKelamin" className="mb-1 block text-sm font-medium">Jenis Kelamin</label><select id="jenisKelamin" value={jenisKelamin} onChange={(e) => setJenisKelamin(e.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" required><option value="">Pilih...</option><option value="Laki-laki">Laki-laki</option><option value="Perempuan">Perempuan</option></select></div>
                    <div><label htmlFor="pekerjaan" className="mb-1 block text-sm font-medium">Pekerjaan</label><input type="text" id="pekerjaan" value={pekerjaan} onChange={(e) => setPekerjaan(e.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" required /></div>
                    <div className="md:col-span-2"><label htmlFor="jaminan" className="mb-1 block text-sm font-medium">Jaminan</label><select id="jaminan" value={jaminan} onChange={(e) => setJaminan(e.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" required><option value="">Pilih jaminan...</option><option value="BPJS">BPJS</option><option value="Asuransi Lain">Asuransi Lain</option><option value="Umum">Umum (Pribadi)</option></select></div>
                </div>
                <div className="text-center"><button type="submit" className="w-full rounded-md bg-primary py-3 font-medium text-primary-foreground hover:opacity-90 md:w-1/2">Mulai Kuesioner</button></div>
            </form>
          ) : (
            <div>
              <div className="mb-6">
                <p className="mb-2 text-center text-sm text-muted-foreground">Langkah {currentPageIndex + 1} dari {pages.length}</p>
                <div className="h-2.5 w-full rounded-full bg-secondary">
                  <div className="h-2.5 rounded-full bg-primary transition-all duration-500" style={{ width: `${progress}%` }}></div>
                </div>
              </div>
              
              <div className="space-y-8">
                <div className="border-b pb-2">
                    <h3 className="text-xl font-semibold text-primary">{pageLabel}</h3>
                </div>

                {isSaranPage ? (
                    <div>
                        <p className="text-center text-sm text-gray-500 mb-4">
                            Apakah ada saran atau masukan lain yang ingin Anda sampaikan untuk perbaikan layanan kami?
                        </p>
                        <textarea
                            id="saran"
                            value={saran}
                            onChange={(e) => setSaran(e.target.value)}
                            rows={5}
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            placeholder="Tuliskan saran Anda di sini (opsional)..."
                        />
                    </div>
                ) : (
                    pageContent.map((question, index) => (
                      <div key={question.id}>
                        <p className="text-md font-medium text-center">{!isSingleQuestionPage && `${index + 1}. `}{question.text}</p>
                        
                        {question.type === 'scale' && (
                           <div className="mt-4">
                            <div className="flex items-center justify-around sm:justify-between px-2 sm:px-4">
                              {scaleOptions.map((label, idx) => {
                                const value = (idx + 1).toString();
                                return (
                                  <div key={value} className="flex flex-col items-center space-y-2" title={label}>
                                    <label htmlFor={`${question.id}-${value}`} className="text-sm font-medium text-gray-700 cursor-pointer">{idx + 1}</label>
                                    <input id={`${question.id}-${value}`} type="radio" name={question.id} value={value} checked={responses[question.id] === value} onChange={(e) => handleScaleChange(question.id, e.target.value)} required className="h-5 w-5 cursor-pointer border-gray-300 text-primary focus:ring-primary" />
                                  </div>
                                );
                              })}
                            </div>
                            <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                              <span>{scaleOptions[0]}</span>
                              <span>{scaleOptions[4]}</span>
                            </div>
                          </div>
                        )}

                        {question.type === 'yes_no_text' && (
                           <div className="mt-4 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              {(['Ya', 'Tidak']).map(choice => (
                                <label key={choice} className="relative cursor-pointer">
                                  <input type="radio" name={`${question.id}-choice`} value={choice} checked={responses[question.id]?.choice === choice} onChange={(e) => handleYesNoTextChange(question.id, 'choice', e.target.value)} required className="peer sr-only" />
                                  <div className="flex h-full items-center justify-center rounded-md border-2 border-muted bg-transparent p-4 text-center text-muted-foreground transition-all duration-200 peer-checked:border-primary peer-checked:bg-primary peer-checked:text-primary-foreground hover:border-primary/50">
                                    <span className="font-medium">{choice}</span>
                                  </div>
                                </label>
                              ))}
                            </div>
                            <div>
                              <label htmlFor={`keterangan-${question.id}`} className="mb-1 block text-sm font-medium text-gray-500">Keterangan (jika ada)</label>
                              <input type="text" id={`keterangan-${question.id}`} value={responses[question.id]?.keterangan || ''} onChange={(e) => handleYesNoTextChange(question.id, 'keterangan', e.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="Isi keterangan jika perlu..."/>
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                )}
              </div>
              
              <div className="mt-10 flex justify-between">
                <button type="button" onClick={handlePrevious} className="rounded-md bg-secondary px-6 py-2 font-medium text-secondary-foreground hover:bg-secondary/80">
                  Kembali
                </button>
                <button type="button" onClick={handleNext} disabled={isSubmitting} className="rounded-md bg-primary px-6 py-2 font-medium text-primary-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50">
                  {isSubmitting ? 'Mengirim...' : (currentPageIndex === pages.length - 1 ? 'Kirim Kuesioner' : 'Berikutnya')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}