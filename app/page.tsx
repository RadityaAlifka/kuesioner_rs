// file: app/page.tsx

import Link from 'next/link';
import Image from 'next/image';

export default function PilihKuesionerPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md text-center">
        <Image src="/logo.jpg" alt="Logo" width={150} height={150} className="mx-auto mb-8" priority />
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Selamat Datang</h1>
        <p className="text-gray-600 mb-8">Silakan pilih kuesioner yang ingin Anda isi.</p>
        <div className="space-y-4">
          <Link
            href="/kuesioner/rawat-inap"
            className="block w-full rounded-md bg-primary py-3 px-4 font-medium text-primary-foreground text-center transition-transform hover:scale-105"
          >
            Kuesioner Rawat Inap
          </Link>
          <Link
            href="/kuesioner/rawat-jalan"
            className="block w-full rounded-md bg-secondary py-3 px-4 font-medium text-secondary-foreground text-center transition-transform hover:scale-105"
          >
            Kuesioner Rawat Jalan
          </Link>
        </div>
      </div>
    </div>
  );
}