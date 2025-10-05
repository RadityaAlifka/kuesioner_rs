'use client';

import { useState } from 'react';
import { DateRange } from 'react-day-picker';
import { Calendar } from "@/components/ui/calendar"; // Sesuaikan path jika perlu
import 'react-day-picker/dist/style.css';
export default function TestCalendarPage() {
  const [date, setDate] = useState<DateRange | undefined>({
    from: new Date(2025, 9, 20), // Contoh tanggal awal
    to: new Date(2025, 9, 28),   // Contoh tanggal akhir
  });

  return (
    <div className="flex justify-center items-center h-screen">
      <Calendar
        mode="range"
        selected={date}
        onSelect={setDate}
        className="rounded-md border"
      />
    </div>
  );
}