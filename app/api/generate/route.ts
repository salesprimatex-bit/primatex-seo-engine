import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      frasaKunci,
      anchorText1,
      url1,
      anchorText2,
      url2
    } = body;

    // TEST RESPONSE DULU (belum AI)
    return NextResponse.json({
      success: true,
      konten: `<h1>${frasaKunci}</h1><p>Ini konten dummy</p>`,
      judul: frasaKunci,
      judul_seo: frasaKunci + " SEO",
      slug: frasaKunci.toLowerCase().replace(/\s+/g, '-'),
      meta_deskripsi: "Meta dari " + frasaKunci,
      kutipan: "Ringkasan " + frasaKunci,
      tag: "geotextile, primatex"
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      message: 'Error server'
    }, { status: 500 });
  }
}
