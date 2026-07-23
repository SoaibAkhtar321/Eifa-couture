import { getStoreSettings } from '@/lib/data/store-settings';
import StoreSettingsForm from '@/components/admin/settings/StoreSettingsForm';
import ErrorState from '@/components/admin/ErrorState';

export const metadata = { title: 'Settings' };

export default async function AdminSettingsPage() {
  const { data: settings, error } = await getStoreSettings();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-3xl text-maroon">Settings</h1>
        <p className="text-charcoal/60 mt-1">Store details, branding, SEO defaults, currency, shipping, and tax.</p>
      </div>

      {error || !settings ? (
        <ErrorState message={error ?? "Couldn't load store settings."} />
      ) : (
        <StoreSettingsForm settings={settings} />
      )}
    </div>
  );
}
