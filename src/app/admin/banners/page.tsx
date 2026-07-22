import Link from 'next/link';

import { listBanners } from '@/lib/data/banners';
import BannerTable from '@/components/admin/banners/BannerTable';

export const metadata = { title: 'Banners' };

export default async function AdminBannersPage() {
  const { data: banners, error } = await listBanners();

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl text-maroon">Banners</h1>
          <p className="text-charcoal/60 mt-1">
            {(banners ?? []).length} banner{(banners ?? []).length === 1 ? '' : 's'}
          </p>
        </div>
        <Link
          href="/admin/banners/new"
          className="rounded-lg bg-maroon px-5 py-2.5 text-sm font-medium text-ivory transition hover:bg-maroon/90"
        >
          Add banner
        </Link>
      </div>

      <BannerTable rows={banners ?? []} error={error} />
    </div>
  );
}
