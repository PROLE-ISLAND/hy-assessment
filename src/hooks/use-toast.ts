/**
 * Toast Hook using Sonner
 * Provides a simple interface compatible with shadcn/ui toast patterns
 */

import { toast as sonnerToast } from 'sonner';

interface ToastOptions {
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive';
  duration?: number;
}

export function useToast() {
  const toast = ({ title, description, variant, duration }: ToastOptions) => {
    const message = title || description || '';
    const options = {
      description: title && description ? description : undefined,
      duration: duration || 4000,
    };

    if (variant === 'destructive') {
      sonnerToast.error(message, options);
    } else {
      sonnerToast.success(message, options);
    }
  };

  return { toast };
}
