import Link from 'next/link';

const quickActions = [
  { label: 'My Orders', href: '/account/orders', desc: 'Track and review past orders' },
  { label: 'Wishlist', href: '/wishlist', desc: 'Your saved pieces' },
  { label: 'Saved Addresses', href: '/account/addresses', desc: 'Manage delivery addresses' },
  { label: 'Account Settings', href: '/account/settings', desc: 'Password, profile, preferences' },
  { label: 'Notifications', href: '/account/notifications', desc: 'Manage alerts' },
  { label: 'Help & Support', href: '/contact', desc: 'Get in touch with us' },
];

export default function AccountQuickActions() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {quickActions.map((action) => (
        <Link
          key={action.href}
          href={action.href}
          className="border border-beige bg-white p-5 transition-all duration-300 hover:border-gold/50"
        >
          <h3 className="font-heading text-xl text-charcoal">{action.label}</h3>
          <p className="mt-2 text-sm leading-6 text-charcoal/55">{action.desc}</p>
        </Link>
      ))}
    </div>
  );
}