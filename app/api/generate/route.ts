import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const body = await req.json();

  return NextResponse.json({
    success: true,
    konten: "<h1>Dummy Konten</h1>",
    judul: "Judul Dummy",
    judul_seo: "Judul SEO Dummy",
    slug: "judul-dummy",
    meta_deskripsi: "Meta dummy",
    kutipan: "Kutipan dummy",
    tag: "tag1, tag2"
  });
}
