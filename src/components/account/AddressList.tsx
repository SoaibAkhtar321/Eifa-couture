'use client';

/* ============================================
   EIFA COUTURE — Address List
   ============================================
   Orchestrates fetch/add/edit/delete/set-default for the account
   addresses page. Refetches after each mutation rather than
   patching local state optimistically — the dataset is small
   (a handful of addresses per user) so correctness against RLS
   wins over shaving a network round-trip.
   ============================================ */

import { useEffect, useState } from 'react';

import { useAuth } from '@/hooks/useAuth';
import {
  fetchAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  type AddressInput,
} from '@/lib/addresses';
import type { DbAddress } from '@/types/database';

import AddressCard from './AddressCard';
import AddressForm from './AddressForm';

type ViewState = { mode: 'list' } | { mode: 'adding' } | { mode: 'editing'; address: DbAddress };

export default function AddressList() {
  const { user, isLoading: isAuthLoading } = useAuth();

  const [addresses, setAddresses] = useState<DbAddress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [view, setView] = useState<ViewState>({ mode: 'list' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const load = async (userId: string) => {
    setIsLoading(true);
    setLoadError(null);
    const { data, error } = await fetchAddresses(userId);
    if (error) setLoadError(error.message);
    else setAddresses(data);
    setIsLoading(false);
  };

  useEffect(() => {
    if (user) load(user.id);
  }, [user]);

  if (isAuthLoading || (isLoading && !loadError)) {
    return (
      <div className="border border-beige bg-white p-8 text-center">
        <p className="text-sm text-charcoal/50">Loading addresses…</p>
      </div>
    );
  }

  if (!user) return null; // page is behind the account auth gate

  if (loadError) {
    return (
      <div className="border border-red-200 bg-red-50 p-8 text-center">
        <p className="text-sm text-red-700">Couldn&apos;t load your addresses. {loadError}</p>
        <button type="button" onClick={() => load(user.id)} className="btn-luxury btn-luxury-secondary mt-5">
          Try Again
        </button>
      </div>
    );
  }

  const handleAdd = async (input: AddressInput) => {
    setIsSubmitting(true);
    setActionError(null);
    const { error } = await createAddress(user.id, input);
    setIsSubmitting(false);
    if (error) return setActionError(error.message);
    setView({ mode: 'list' });
    load(user.id);
  };

  const handleEdit = async (input: AddressInput) => {
    if (view.mode !== 'editing') return;
    setIsSubmitting(true);
    setActionError(null);
    const { error } = await updateAddress(user.id, view.address.id, input);
    setIsSubmitting(false);
    if (error) return setActionError(error.message);
    setView({ mode: 'list' });
    load(user.id);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Remove this address?')) return;
    setBusyId(id);
    setActionError(null);
    const { error } = await deleteAddress(user.id, id);
    setBusyId(null);
    if (error) return setActionError(error.message);
    load(user.id);
  };

  const handleSetDefault = async (id: string) => {
    setBusyId(id);
    setActionError(null);
    const { error } = await setDefaultAddress(user.id, id);
    setBusyId(null);
    if (error) return setActionError(error.message);
    load(user.id);
  };

  return (
    <div className="space-y-6">
      {actionError && (
        <p className="font-body text-xs text-red-700 bg-red-50 border border-red-200 px-4 py-3">
          {actionError}
        </p>
      )}

      {view.mode === 'adding' && (
        <AddressForm
          forceDefault={addresses.length === 0}
          isSubmitting={isSubmitting}
          submitLabel="Save Address"
          onSubmit={handleAdd}
          onCancel={() => setView({ mode: 'list' })}
        />
      )}

      {view.mode === 'editing' && (
        <AddressForm
          initialValues={view.address}
          forceDefault={addresses.length === 1}
          isSubmitting={isSubmitting}
          submitLabel="Update Address"
          onSubmit={handleEdit}
          onCancel={() => setView({ mode: 'list' })}
        />
      )}

      {addresses.length === 0 && view.mode === 'list' ? (
        <div className="border border-beige bg-white p-8 text-center">
          <p className="text-sm text-charcoal/55">No saved addresses yet.</p>
        </div>
      ) : (
        view.mode === 'list' && (
          <div className="space-y-4">
            {addresses.map((address) => (
              <AddressCard
                key={address.id}
                address={address}
                isBusy={busyId === address.id}
                onEdit={() => setView({ mode: 'editing', address })}
                onDelete={() => handleDelete(address.id)}
                onSetDefault={() => handleSetDefault(address.id)}
              />
            ))}
          </div>
        )
      )}
    </div>
  );
}