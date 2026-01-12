import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-material font-medium transition-all duration-material disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 uppercase tracking-wide focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'bg-slate-700 text-white hover:bg-slate-800 active:bg-slate-900 shadow-material-2 hover:shadow-material-3 focus-visible:ring-slate-500',
        destructive: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 shadow-material-2 hover:shadow-material-3 focus-visible:ring-red-500',
        outline: 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 active:bg-slate-100 shadow-material-1 hover:shadow-material-2 focus-visible:ring-slate-500',
        secondary: 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 active:bg-slate-100 shadow-material-2 hover:shadow-material-3 focus-visible:ring-slate-500',
        ghost: 'bg-transparent text-slate-700 hover:bg-slate-100 active:bg-slate-200 focus-visible:ring-slate-500',
        link: 'bg-transparent text-slate-700 hover:text-slate-900 underline-offset-4 hover:underline focus-visible:ring-slate-500',
      },
      size: {
        default: 'h-10 px-4 py-2 text-sm',
        sm: 'h-8 rounded-material px-3 text-xs',
        lg: 'h-12 rounded-material px-6 py-3 text-base',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
