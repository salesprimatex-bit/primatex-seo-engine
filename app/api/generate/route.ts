import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      frasaKunci,
      anchorText1,
      url1,
      anchorText2,
      url2,
    } = body || {};

    if (!frasaKunci || !anchorText1 || !url1 || !anchorText2 || !url2) {
      return NextResponse.json(
        { success: false, message: 'Data belum lengkap' },
        { status: 400 }
      );
    }

    // Panggil fungsi generator Anda di sini.
    // Misalnya: generateArticle(...)
    const generated = await generateArticle({
      frasaKunci,
      anchorText1,
      url1,
      anchorText2,
      url2,
    });

    return NextResponse.json({
      success: true,
      konten: generated.konten,
      judul: generated.judul,
      judul_seo: generated.judul_seo,
      slug: generated.slug,
      meta_deskripsi: generated.meta_deskripsi,
      kutipan: generated.kutipan,
      tag: generated.tag,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || 'Server error' },
      { status: 500 }
    );
  }
}

async function generateArticle(input: {
  frasaKunci: string;
  anchorText1: string;
  url1: string;
  anchorText2: string;
  url2: string;
}) {
  // GANTI bagian ini dengan logic generator Anda yang sudah ada
  // Contoh output dummy:
  return {
    konten: `<article><h1>${input.frasaKunci}</h1><p>Konten HTML...</p></article>`,
    judul: input.frasaKunci,
    judul_seo: `${input.frasaKunci} - Primatex`,
    slug: input.frasaKunci.toLowerCase().replace(/\s+/g, '-'),
    meta_deskripsi: `Artikel tentang ${input.frasaKunci}`,
    kutipan: `Ringkasan singkat ${input.frasaKunci}`,
    tag: `${input.frasaKunci}, geotextile, primatex`,
  };
}
