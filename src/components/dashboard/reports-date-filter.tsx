'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';
import { DateRange } from 'react-day-picker';
import { DateRangePicker } from '@/components/ui/date-range-picker';

export function ReportsDateFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Parse current date range from URL
  const currentDateRange: DateRange | undefined = (() => {
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    if (!from) return undefined;
    return {
      from: new Date(from),
      to: to ? new Date(to) : undefined,
    };
  })();

  // Update URL when date range changes
  const handleDateRangeChange = useCallback(
    (range: DateRange | undefined) => {
      const params = new URLSearchParams(searchParams.toString());

      if (range?.from) {
        params.set('from', range.from.toISOString().split('T')[0]);
        if (range.to) {
          params.set('to', range.to.toISOString().split('T')[0]);
        } else {
          params.delete('to');
        }
      } else {
        // Clear filter (all time)
        params.delete('from');
        params.delete('to');
      }

      router.push(`?${params.toString()}`);
    },
    [router, searchParams]
  );

  return (
    <DateRangePicker
      dateRange={currentDateRange}
      onDateRangeChange={handleDateRangeChange}
    />
  );
}
