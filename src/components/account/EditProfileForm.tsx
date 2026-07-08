'use client';

/* ============================================
   EIFA COUTURE — Edit Profile Form
   ============================================
   Renders at the top of /account/settings. Reads current values from
   `user.user_metadata` and saves back via `useAuth().updateProfile`,
   which calls `supabase.auth.updateUser({ data })`. No `profiles`
   table write — gender/date_of_birth intentionally live in auth
   metadata only (see project decision log), so this form is the
   single source of truth for those fields today.

   `onAuthStateChange` (subscribed in AuthProvider) fires after a
   successful updateUser call, so the store — and therefore
   AccountHeader/AccountOverview — refresh automatically. No manual
   refetch or page reload needed here.
   ============================================ */

import { useState } from 'react';

import { useAuth } from '@/hooks/useAuth';

const GENDER_OPTIONS = [
  { value: '', label: 'Prefer not to say' },
  { value: 'female', label: 'Female' },
  { value: 'male', label: 'Male' },
  { value: 'other', label: 'Other' },
];

function isValidIndianPhone(value: string) {
  if (!value) return true; // optional field
  return /^[6-9]\d{9}$/.test(value.trim());
}

export default function EditProfileForm() {
  const { user, updateProfile } = useAuth();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Sync local form state whenever the underlying user record changes
  // (e.g. once the session finishes loading, or after a save round-trips
  // through the store). This runs during render — not in an effect — so
  // it updates in the same pass instead of causing an extra render.
  const [loadedUserId, setLoadedUserId] = useState<string | null>(null);
  if (user && user.id !== loadedUserId) {
    const metadata = (user.user_metadata ?? {}) as Record<string, string | undefined>;
    setLoadedUserId(user.id);
    setFullName(metadata.full_name || '');
    setPhone(metadata.phone || '');
    setGender(metadata.gender || '');
    setDateOfBirth(metadata.date_of_birth || '');
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!fullName.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (!isValidIndianPhone(phone)) {
      setError('Please enter a valid 10-digit phone number.');
      return;
    }
    if (dateOfBirth && new Date(dateOfBirth) > new Date()) {
      setError('Date of birth cannot be in the future.');
      return;
    }

    setIsSaving(true);
    const { error: updateError } = await updateProfile({
      full_name: fullName.trim(),
      phone: phone.trim(),
      gender,
      date_of_birth: dateOfBirth,
    });
    setIsSaving(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setSuccess(true);
  };

  return (
    <div className="border border-beige bg-white p-6 sm:p-8">
      <span className="mb-3 block font-body text-[10px] uppercase tracking-[0.28em] text-gold">
        Profile Information
      </span>
      <h2 className="font-heading text-2xl text-charcoal">Edit Profile</h2>
      <p className="mt-2 text-sm leading-6 text-charcoal/55">
        Keep your details up to date for a smoother checkout and delivery experience.
      </p>

      {error && (
        <p className="mt-6 font-body text-xs text-red-700 bg-red-50 border border-red-200 px-4 py-3">
          {error}
        </p>
      )}
      {success && !error && (
        <p className="mt-6 font-body text-xs text-green-700 bg-green-50 border border-green-200 px-4 py-3">
          Profile updated successfully.
        </p>
      )}

      <form className="mt-6 grid gap-5 sm:grid-cols-2" onSubmit={handleSubmit} noValidate>
        <div>
          <label
            htmlFor="fullName"
            className="block font-body text-[10px] uppercase tracking-[0.15em] text-charcoal/75 mb-2"
          >
            Full Name
          </label>
          <input
            type="text"
            id="fullName"
            name="fullName"
            placeholder="Enter your full name"
            className="w-full border border-charcoal/15 bg-ivory px-4 py-3 font-body text-sm text-charcoal outline-none transition-colors focus:border-gold placeholder:text-charcoal/45"
            value={fullName}
            onChange={(e) => {
              setFullName(e.target.value);
              setSuccess(false);
            }}
            autoComplete="name"
            required
          />
        </div>

        <div>
          <label
            htmlFor="email"
            className="block font-body text-[10px] uppercase tracking-[0.15em] text-charcoal/75 mb-2"
          >
            Email Address
          </label>
          <input
            type="email"
            id="email"
            name="email"
            className="w-full border border-charcoal/15 bg-cream/60 px-4 py-3 font-body text-sm text-charcoal/60 outline-none cursor-not-allowed"
            value={user?.email || ''}
            disabled
            readOnly
          />
        </div>

        <div>
          <label
            htmlFor="phone"
            className="block font-body text-[10px] uppercase tracking-[0.15em] text-charcoal/75 mb-2"
          >
            Phone Number
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            placeholder="10-digit mobile number"
            className="w-full border border-charcoal/15 bg-ivory px-4 py-3 font-body text-sm text-charcoal outline-none transition-colors focus:border-gold placeholder:text-charcoal/45"
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value);
              setSuccess(false);
            }}
            autoComplete="tel"
            inputMode="numeric"
          />
        </div>

        <div>
          <label
            htmlFor="gender"
            className="block font-body text-[10px] uppercase tracking-[0.15em] text-charcoal/75 mb-2"
          >
            Gender
          </label>
          <select
            id="gender"
            name="gender"
            className="w-full border border-charcoal/15 bg-ivory px-4 py-3 font-body text-sm text-charcoal outline-none transition-colors focus:border-gold"
            value={gender}
            onChange={(e) => {
              setGender(e.target.value);
              setSuccess(false);
            }}
          >
            {GENDER_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="dateOfBirth"
            className="block font-body text-[10px] uppercase tracking-[0.15em] text-charcoal/75 mb-2"
          >
            Date of Birth
          </label>
          <input
            type="date"
            id="dateOfBirth"
            name="dateOfBirth"
            max={new Date().toISOString().split('T')[0]}
            className="w-full border border-charcoal/15 bg-ivory px-4 py-3 font-body text-sm text-charcoal outline-none transition-colors focus:border-gold"
            value={dateOfBirth}
            onChange={(e) => {
              setDateOfBirth(e.target.value);
              setSuccess(false);
            }}
          />
        </div>

        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={isSaving}
            className="btn-luxury btn-luxury-primary disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
