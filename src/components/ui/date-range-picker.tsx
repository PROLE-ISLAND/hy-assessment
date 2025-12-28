'use client';

import * as React from 'react';
import { format, subDays, subMonths, startOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Calendar as CalendarIcon } from 'lucide-react';
import { DateRange } from 'react-day-picker';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

// Preset definitions
const PRESETS = [
  {
    label: '今週',
    getValue: () => ({
      from: startOfWeek(new Date(), { weekStartsOn: 1 }),
      to: new Date(),
    }),
  },
  {
    label: '今月',
    getValue: () => ({
      from: startOfMonth(new Date()),
      to: new Date(),
    }),
  },
  {
    label: '先月',
    getValue: () => {
      const lastMonth = subMonths(new Date(), 1);
      return {
        from: startOfMonth(lastMonth),
        to: endOfMonth(lastMonth),
      };
    },
  },
  {
    label: '過去3ヶ月',
    getValue: () => ({
      from: subMonths(new Date(), 3),
      to: new Date(),
    }),
  },
  {
    label: '全期間',
    getValue: () => undefined,
  },
] as const;

interface DateRangePickerProps {
  dateRange: DateRange | undefined;
  onDateRangeChange: (range: DateRange | undefined) => void;
  className?: string;
}

export function DateRangePicker({
  dateRange,
  onDateRangeChange,
  className,
}: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false);

  // Format date range for display
  const formatDateRange = () => {
    if (!dateRange?.from) {
      return '全期間';
    }
    if (dateRange.to) {
      return `${format(dateRange.from, 'yyyy/MM/dd', { locale: ja })} - ${format(dateRange.to, 'yyyy/MM/dd', { locale: ja })}`;
    }
    return format(dateRange.from, 'yyyy/MM/dd', { locale: ja });
  };

  // Check if current selection matches a preset
  const getActivePreset = () => {
    if (!dateRange?.from) return '全期間';
    for (const preset of PRESETS) {
      if (preset.label === '全期間') continue;
      const presetValue = preset.getValue();
      if (
        presetValue?.from &&
        presetValue?.to &&
        dateRange.from?.toDateString() === presetValue.from.toDateString() &&
        dateRange.to?.toDateString() === presetValue.to.toDateString()
      ) {
        return preset.label;
      }
    }
    return null;
  };

  const activePreset = getActivePreset();

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      {/* Preset buttons */}
      <div className="flex flex-wrap gap-1">
        {PRESETS.map((preset) => (
          <Button
            key={preset.label}
            variant={activePreset === preset.label ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              onDateRangeChange(preset.getValue());
            }}
          >
            {preset.label}
          </Button>
        ))}
      </div>

      {/* Custom date range picker */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              'min-w-[240px] justify-start text-left font-normal',
              !dateRange && 'text-muted-foreground'
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {formatDateRange()}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={dateRange?.from}
            selected={dateRange}
            onSelect={(range) => {
              onDateRangeChange(range);
              // Close popover when both dates are selected
              if (range?.from && range?.to) {
                setOpen(false);
              }
            }}
            numberOfMonths={2}
            disabled={(date) => date > new Date()}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
