'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image'; // Impor Image
import { supabase } from '@/lib/supabaseClient';

interface Question {
  id: string;
  text: string;
  urutan: number;
}

export default function Home() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [usia, setUsia] = useState<string>('');
  const [jenisKelamin, setJenisKelamin] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitSuccess, setSubmitSuccess] = useState<boolean>(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isInfoSubmitted, setIsInfoSubmitted] = useState(false);

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    try {
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .eq('aktif', true)
        .order('urutan', { ascending: true });

      if (error) throw error;
      setQuestions(data || []);
    } catch (error) {
      console.error('Error fetching questions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId: string, value: string) => {
    setResponses(prev => ({ ...prev, [questionId]: value }));
  };

  const handleNext = () => {
    const currentQuestion = questions[currentQuestionIndex];
    if (!responses[currentQuestion.id]) {
      alert('Anda harus memilih salah satu jawaban.');
      return;
    }
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prevIndex => prevIndex + 1);
    } else {
      handleSubmit();
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prevIndex => prevIndex - 1);
    } else {
      setIsInfoSubmitted(false);
    }
  };
  
  const handleInfoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (usia && jenisKelamin) {
      setIsInfoSubmitted(true);
    }
  };

  const handleSubmit = async () => {
    if (Object.keys(responses).length !== questions.length) {
      alert("Pastikan semua pertanyaan telah dijawab sebelum mengirim.");
      return;
    }
    setIsSubmitting(true);
    try {
      const { data: responseData, error: responseError } = await supabase
        .from('responses')
        .insert([{ usia: parseInt(usia), jenis_kelamin: jenisKelamin }])
        .select();

      if (responseError) throw responseError;
      if (!responseData || responseData.length === 0) throw new Error('Gagal membuat respons');
      
      const responseId = responseData[0].id;
      const answersToInsert = Object.entries(responses).map(([questionId, value]) => ({
        response_id: responseId, question_id: questionId, value
      }));

      if (answersToInsert.length > 0) {
        const { error: answersError } = await supabase.from('answers').insert(answersToInsert);
        if (answersError) throw answersError;
      }

      setSubmitSuccess(true);
      setTimeout(() => { window.location.href = '/thankyou'; }, 1500);
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Terjadi kesalahan saat mengirim kuesioner. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const progress = questions.length > 0 ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0;
  const currentQuestion = questions[currentQuestionIndex];

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

    // if (submitSuccess) {
    //   return (
    //     <div className="flex min-h-screen items-center justify-center bg-background p-4">
    //       <div className="w-full max-w-md rounded-lg bg-card p-8 text-center shadow-md">
    //         <div className="mb-4 text-5xl text-green-500">✓</div>
    //         <h1 className="mb-2 text-2xl font-bold text-card-foreground">Terima Kasih!</h1>
    //         <p className="text-muted-foreground">Kuesioner Anda telah berhasil dikirim.</p>
    //       </div>
    //     </div>
    //   );
    // }

  return (
    <div className="flex min-h-screen items-center bg-background p-4">
      <div className="mx-auto w-full max-w-2xl">
        <div className="mb-8 text-center">
          {/* === LOGO DIPANGGIL DENGAN BENAR DI SINI === */}
          <Image
            src="/images/logo.jpg" // <-- Langsung panggil path dari folder public
            alt="Simalungun Optikal Logo"
            width={150}
            height={76} // Menambahkan height untuk performa
            className="mx-auto rounded-2xl"
            priority
          />
        </div>

        <div className="rounded-lg bg-card p-6 text-card-foreground shadow-md sm:p-8">
          {!isInfoSubmitted ? (
            <form onSubmit={handleInfoSubmit}>
              <h2 className="mb-6 text-center text-xl font-semibold">Informasi Responden</h2>
              <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label htmlFor="usia" className="mb-1 block text-sm font-medium">Usia</label>
                  <input type="number" id="usia" value={usia} onChange={(e) => setUsia(e.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" min="1" max="120" required />
                </div>
                <div>
                  <label htmlFor="jenisKelamin" className="mb-1 block text-sm font-medium">Jenis Kelamin</label>
                  <select id="jenisKelamin" value={jenisKelamin} onChange={(e) => setJenisKelamin(e.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2" required>
                    <option value="">Pilih jenis kelamin</option>
                    <option value="Laki-laki">Laki-laki</option>
                    <option value="Perempuan">Perempuan</option>
                  </select>
                </div>
              </div>
              <div className="text-center">
                <button type="submit" className="w-full rounded-md bg-primary py-3 font-medium text-primary-foreground hover:opacity-90 md:w-1/2">
                  Mulai Kuesioner
                </button>
              </div>
            </form>
          ) : (
            <div>
              <div className="mb-8">
                <p className="mb-2 text-center text-sm text-muted-foreground">Pertanyaan {currentQuestionIndex + 1} dari {questions.length}</p>
                <div className="h-2.5 w-full rounded-full bg-secondary">
                  <div className="h-2.5 rounded-full bg-primary transition-all duration-500" style={{ width: `${progress}%` }}></div>
                </div>
              </div>

              {questions.length > 0 && currentQuestion && (
                <div key={currentQuestion.id}>
                  <p className="text-center text-lg font-medium">{currentQuestion.text}</p>
                  <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
                    {['Tidak Puas', 'Puas', 'Sangat Puas'].map((label, index) => {
                      const value = (index + 1).toString();
                      return (
                        <label key={value} className="relative cursor-pointer">
                          <input type="radio" name={currentQuestion.id} value={value} checked={responses[currentQuestion.id] === value} onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)} required className="peer sr-only" />
                          <div className="flex h-full flex-col items-center justify-center rounded-md border-2 border-muted bg-transparent p-4 text-center text-muted-foreground transition-all duration-200 peer-checked:border-primary peer-checked:bg-primary peer-checked:text-primary-foreground hover:border-primary/50">
                            <span className="text-sm font-medium">{label}</span>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
              
              <div className="mt-8 flex justify-between">
                <button type="button" onClick={handlePrevious} className="rounded-md bg-secondary px-6 py-2 font-medium text-secondary-foreground hover:bg-secondary/80">
                  Kembali
                </button>
                <button type="button" onClick={handleNext} disabled={!responses[currentQuestion?.id] || isSubmitting} className="rounded-md bg-primary px-6 py-2 font-medium text-primary-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50">
                  {isSubmitting ? 'Mengirim...' : (currentQuestionIndex === questions.length - 1 ? 'Kirim Kuesioner' : 'Berikutnya')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}