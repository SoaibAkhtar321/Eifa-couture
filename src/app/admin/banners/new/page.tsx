import BannerForm from '@/components/admin/banners/BannerForm';

export const metadata = { title: 'New Banner' };

export default function NewBannerPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-3xl text-maroon">Add banner</h1>
        <p className="text-charcoal/60 mt-1">Hero banners appear at the top of the storefront homepage.</p>
      </div>

      <BannerForm />
    </div>
  );
}
