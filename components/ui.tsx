'use client';

import Link from 'next/link';
import type { ButtonHTMLAttributes, ComponentProps, InputHTMLAttributes, PropsWithChildren, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export function Card({ className, children }: PropsWithChildren<{ className?: string }>) {
  return <section className={cn('rounded-3xl border border-line bg-white p-6 shadow-soft', className)}>{children}</section>;
}

export function SectionTitle({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-ink">{title}</h2>
        {description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={cn(
        'h-11 rounded-2xl border border-line bg-white px-4 text-sm outline-none transition focus:border-slate-400',
        props.className
      )}
    />
  );
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        'h-11 rounded-2xl border border-line bg-white px-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400',
        props.className
      )}
    />
  );
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={cn(
        'min-h-[120px] rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400',
        props.className
      )}
    />
  );
}

export function Button({ className, children, asLink, ...props }: PropsWithChildren<ButtonHTMLAttributes<HTMLButtonElement> & { asLink?: string }>) {
  if (asLink) {
    return (
      <Link href={asLink as ComponentProps<typeof Link>['href']} className={cn('inline-flex h-11 items-center justify-center rounded-2xl bg-ink px-4 text-sm font-medium text-white', className)}>
        {children}
      </Link>
    );
  }
  return (
    <button
      {...props}
      className={cn('inline-flex h-11 items-center justify-center rounded-2xl bg-ink px-4 text-sm font-medium text-white disabled:opacity-60', className)}
    >
      {children}
    </button>
  );
}
