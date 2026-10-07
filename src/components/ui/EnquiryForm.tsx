import React, { useState } from 'react';
import { CheckCircle2, Loader2, Lock, Send } from 'lucide-react';
import { company, formsAccessKey } from '../../config/company';
import { trackLead } from '../../lib/analytics';

export type Field = {
  name: string;
  label: string;
  type?: 'text' | 'tel' | 'email' | 'select' | 'textarea';
  placeholder?: string;
  options?: string[];
  required?: boolean;
  half?: boolean;
};

type Props = {
  fields: Field[];
  subject: string; // how the enquiry is labelled in the inbox
  submitLabel: string;
  successMessage?: string;
};

type Status = 'idle' | 'sending' | 'sent' | 'error';

// Submissions go to Web3Forms, which emails them to the registered inbox.
const EnquiryForm: React.FC<Props> = ({
  fields,
  subject,
  submitLabel,
  successMessage = 'Thank you — we have your details and will call you soon.',
}) => {
  const [values, setValues] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<Status>('idle');

  const update = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => setValues({ ...values, [e.target.name]: e.target.value });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Honeypot: real people never see or fill this field.
    if ((e.currentTarget.elements.namedItem('botcheck') as HTMLInputElement)?.checked) return;

    setStatus('sending');
    const labelled = Object.fromEntries(
      fields.filter((f) => values[f.name]?.trim()).map((f) => [f.label, values[f.name].trim()]),
    );
    try {
      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          access_key: formsAccessKey,
          subject,
          from_name: `${company.brand} website`,
          ...labelled,
        }),
      });
      const data = await res.json();
      setStatus(data.success ? 'sent' : 'error');
      if (data.success) {
        setValues({});
        trackLead(subject);
      }
    } catch {
      setStatus('error');
    }
  };

  if (status === 'sent') {
    return (
      <div className="flex flex-col items-center py-10 text-center">
        <CheckCircle2 className="h-12 w-12 text-moss-600" />
        <h3 className="mt-5 text-xl font-bold">Message sent</h3>
        <p className="mt-2 max-w-sm text-ink-soft">{successMessage}</p>
        <button onClick={() => setStatus('idle')} className="btn-secondary mt-8">
          Send another
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-5 sm:grid-cols-2">
      <input type="checkbox" name="botcheck" className="hidden" tabIndex={-1} autoComplete="off" />
      {fields.map((f) => {
        const common = {
          id: f.name,
          name: f.name,
          required: f.required,
          value: values[f.name] ?? '',
          onChange: update,
          className: 'field',
        };
        return (
          <div key={f.name} className={f.half ? '' : 'sm:col-span-2'}>
            <label htmlFor={f.name} className="field-label">
              {f.label}
              {f.required && <span className="text-brand-600"> *</span>}
            </label>
            {f.type === 'select' ? (
              <select {...common}>
                <option value="" disabled>
                  Select…
                </option>
                {f.options?.map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
            ) : f.type === 'textarea' ? (
              <textarea
                {...common}
                rows={4}
                placeholder={f.placeholder}
                className="field resize-none"
              />
            ) : (
              <input {...common} type={f.type ?? 'text'} placeholder={f.placeholder} />
            )}
          </div>
        );
      })}
      <div className="sm:col-span-2">
        <button
          type="submit"
          disabled={status === 'sending'}
          className="btn-primary w-full disabled:opacity-60 sm:w-auto"
        >
          {status === 'sending' ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Sending…
            </>
          ) : (
            <>
              <Send className="h-4 w-4" /> {submitLabel}
            </>
          )}
        </button>
        {status === 'error' ? (
          <p className="mt-3 text-sm text-brand-700">
            Sorry, that didn’t go through. Please try again, or call us on{' '}
            <a href={`tel:${company.phoneTel}`} className="font-semibold underline">
              {company.phoneDisplay}
            </a>
            .
          </p>
        ) : (
          <p className="mt-3 flex items-start gap-1.5 text-xs leading-relaxed text-ink-mute">
            <Lock className="mt-px h-3.5 w-3.5 shrink-0" />
            <span>
              We only use your details to get back to you — never shared or sold. Prefer to talk?
              Call {company.phoneDisplay}.
            </span>
          </p>
        )}
      </div>
    </form>
  );
};

export default EnquiryForm;
