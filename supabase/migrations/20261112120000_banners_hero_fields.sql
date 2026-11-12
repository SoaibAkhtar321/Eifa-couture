-- Hero CMS: extra banner fields (idempotent).
alter table banners add column if not exists video_url text;
alter table banners add column if not exists secondary_cta_label text;
alter table banners add column if not exists secondary_link_url text;
