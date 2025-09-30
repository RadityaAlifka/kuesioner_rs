import Link from 'next/link';
import Image from 'next/image';

// Pastikan path ke logo sudah benar
import Logo from '../../public/images/logo.jpg'; 

export default function ThankYouPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
        
        {/* --- AREA LOGO YANG DIPERBARUI --- */}
        <div className="mb-6">
          <Image
            src={Logo}
            alt="Simalungun Optikal Logo"
            width={150} // Ukuran disesuaikan kembali untuk bentuk asli
            // height tidak perlu ditentukan agar rasio aspek terjaga
            className="mx-auto rounded-2xl" // Menggunakan rounded-2xl untuk sudut melengkung
            priority
          />
        </div>

        <div className="text-green-500 text-5xl mb-4">✓</div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Terima Kasih!</h1>
        <p className="text-gray-600 mb-6">
          Kuesioner Anda telah berhasil dikirim. Kami sangat menghargai partisipasi Anda.
        </p>
        <Link
          href="/"
          className="inline-block bg-orange-500 hover:bg-orange-600 text-white font-medium py-2 px-4 rounded-md transition-transform transform hover:scale-105"
        >
          Isi Kuesioner Lagi
        </Link>
      </div>
    </div>
  );
}