'use client';

// =====================================================
// Template Status Toggle
// Toggle active/inactive status of a template
// =====================================================

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Switch } from '@/components/ui/switch';
import { Loader2 } from 'lucide-react';

interface TemplateStatusToggleProps {
  templateId: string;
  isActive: boolean;
}

export function TemplateStatusToggle({
  templateId,
  isActive,
}: TemplateStatusToggleProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [checked, setChecked] = useState(isActive);

  const handleToggle = async (newValue: boolean) => {
    setLoading(true);
    setChecked(newValue);

    try {
      const response = await fetch(`/api/templates/${templateId}/toggle`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: newValue }),
      });

      if (!response.ok) {
        // Revert on error
        setChecked(!newValue);
        throw new Error('Failed to update status');
      }

      router.refresh();
    } catch (error) {
      console.error('Toggle error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      <Switch
        checked={checked}
        onCheckedChange={handleToggle}
        disabled={loading}
      />
    </div>
  );
}
