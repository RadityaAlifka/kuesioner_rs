'use client'; // Tambahkan ini di baris paling atas

import Link from 'next/link';
import Image from 'next/image';
import { BedDouble, PersonStanding } from 'lucide-react'; // Impor ikon

export default function PilihKuesionerPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md text-center">
        <Image src="/images/logo.jpg" alt="Logo" width={150} height={150} className="mx-auto mb-8" priority />
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Selamat Datang</h1>
        <p className="text-gray-600 mb-8">Silakan pilih kuesioner yang ingin Anda isi.</p>
        
        <div className="space-y-4">
          {/* Tombol Primer - Rawat Inap */}
          <Link
            href="/kuesioner/rawat-inap"
            className="group flex w-full items-center justify-center gap-x-3 rounded-lg bg-primary py-4 px-4 font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 hover:shadow-md"
          >
            <BedDouble className="h-5 w-5 transition-transform group-hover:scale-110" />
            <span>Kuesioner Rawat Inap</span>
          </Link>
          
          {/* Tombol Sekunder - Rawat Jalan */}
          <Link
            href="/kuesioner/rawat-jalan"
            className="group flex w-full items-center justify-center gap-x-3 rounded-lg border border-primary bg-transparent py-4 px-4 font-semibold text-primary shadow-sm transition-all hover:bg-primary hover:text-primary-foreground hover:shadow-md"
          >
            <PersonStanding className="h-5 w-5 transition-transform group-hover:scale-110" />
            <span>Kuesioner Rawat Jalan</span>
          </Link>
        </div>
      </div>
    </div>
  );
}