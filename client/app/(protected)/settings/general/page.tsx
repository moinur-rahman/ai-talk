'use client';
import { useState } from 'react';
import { FiUser, FiSave } from 'react-icons/fi';
import {
  useGetMeQuery,
  useUpdateMeMutation,
  type User,
} from '@/services/userApi';

const WORK_OPTIONS = [
  'Engineering',
  'Design',
  'Product',
  'Marketing',
  'Sales',
  'Finance',
  'Legal',
  'Operations',
  'Research',
  'Education',
  'Healthcare',
  'Other',
];

const GeneralSettingsForm = ({ user }: { user: User }) => {
  const [updateMe, { isLoading: isSaving }] = useUpdateMeMutation();

  const [name, setName] = useState(user.name ?? '');
  const [displayName, setDisplayName] = useState(user.displayName ?? '');
  const [workDescription, setWorkDescription] = useState(
    user.workDescription ?? '',
  );
  const [customInstructions, setCustomInstructions] = useState(
    user.customInstructions ?? '',
  );
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    await updateMe({ name, displayName, workDescription, customInstructions });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="bg-surface-dim border border-border rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-surface-elevated flex items-center justify-center shrink-0">
          <FiUser size={14} className="text-muted" />
        </div>
        <p className="text-heading text-sm font-medium">{user.email ?? ''}</p>
      </div>

      <div className="px-5 py-4 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-muted text-xs mb-1.5">Full name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-surface-elevated border border-border rounded-lg px-3 py-2 text-sm text-body focus:outline-none focus:border-border-focus"
            />
          </div>
          <div>
            <label className="block text-muted text-xs mb-1.5">
              What should the AI call you?
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Nickname or first name"
              className="w-full bg-surface-elevated border border-border rounded-lg px-3 py-2 text-sm text-body placeholder:text-muted/50 focus:outline-none focus:border-border-focus"
            />
          </div>
        </div>

        <div>
          <label className="block text-muted text-xs mb-1.5">
            What best describes your work?
          </label>
          <select
            value={workDescription}
            onChange={(e) => setWorkDescription(e.target.value)}
            className="w-full bg-surface-elevated border border-border rounded-lg px-3 py-2 text-sm text-body focus:outline-none focus:border-border-focus"
          >
            <option value="">Select an option</option>
            {WORK_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-muted text-xs mb-1.5">
            What personal preferences should the AI consider?
          </label>
          <p className="text-muted text-[11px] mb-2">
            Your preferences will apply to all conversations.
          </p>
          <textarea
            value={customInstructions}
            onChange={(e) => setCustomInstructions(e.target.value)}
            rows={4}
            placeholder="e.g. Always be concise. Prefer code examples over explanations."
            className="w-full bg-surface-elevated border border-border rounded-lg px-3 py-2 text-sm text-body placeholder:text-muted/50 focus:outline-none focus:border-border-focus resize-none"
          />
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-elevated border border-border text-body hover:bg-surface-raised text-sm font-medium transition-colors disabled:opacity-60"
          >
            <FiSave size={13} />
            {isSaving ? 'Saving…' : saved ? 'Saved!' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
};

const GeneralSettingsPage = () => {
  const { data: user } = useGetMeQuery();

  return (
    <div className="max-w-2xl px-8 py-10">
      <h1 className="text-primary font-semibold text-lg mb-8">General</h1>

      <section>
        <p className="text-muted text-[10px] font-semibold uppercase tracking-widest mb-3">
          Profile
        </p>
        {user && <GeneralSettingsForm key={user.email} user={user} />}
      </section>
    </div>
  );
};

export default GeneralSettingsPage;
