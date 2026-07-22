import { notFound } from 'next/navigation';

import { getBanner } from '@/lib/data/banners';
import BannerForm from '@/components/admin/banners/BannerForm';

export const metadata = { title: 'Edit Banner' };

interface EditBannerPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditBannerPage({ params }: EditBannerPageProps) {
  const { id } = await params;

  const { data: banner, error } = await getBanner(id);

  if (error || !banner) {
    notFound();
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-3xl text-maroon">{banner.title}</h1>
        <p className="text-charcoal/60 mt-1">Edit banner details.</p>
      </div>

      <BannerForm banner={banner} />
    </div>
  );
}
