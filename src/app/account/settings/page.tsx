import Link from 'next/link';

export const metadata = { title: 'Account Settings | Eifa Couture' };

const settingsSections = [
  { title: 'Change Password', desc: 'Update your account password' },
  { title: 'Notification Preferences', desc: 'Choose what updates you receive' },
  { title: 'Privacy & Security', desc: 'Manage your data and security options' },
];

export default function SettingsPage() {
  return (
    <main className="bg-ivory">
      <section className="luxury-container py-10 sm:py-14 lg:py-20">
        <nav aria-label="Breadcrumb" className="mb-5 flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-charcoal/45 sm:text-[11px]">
          <Link href="/account" className="hover:text-maroon">Account</Link>
          <span>/</span>
          <span className="text-charcoal/70">Settings</span>
        </nav>

        <h1 className="font-heading text-4xl text-charcoal sm:text-5xl">Account Settings</h1>

        <div className="mt-8 space-y-4">
          {settingsSections.map((s) => (
            <div key={s.title} className="flex items-center justify-between border border-beige bg-white p-5">
              <div>
                <h3 className="font-heading text-xl text-charcoal">{s.title}</h3>
                <p className="mt-1 text-sm text-charcoal/55">{s.desc}</p>
              </div>
              <button type="button" className="btn-luxury btn-luxury-secondary">Manage</button>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}