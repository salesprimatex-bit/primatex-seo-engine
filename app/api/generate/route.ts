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
    } = body;

    if (!frasaKunci || !anchorText1 || !url1 || !anchorText2 || !url2) {
      return NextResponse.json({
        success: false,
        message: 'Input tidak lengkap',
      }, { status: 400 });
    }

    const result = await generateArticle({
      frasaKunci,
      anchorText1,
      url1,
      anchorText2,
      url2,
    });

    return NextResponse.json({
      success: true,
      ...result
    });

  } catch (err: any) {
    return NextResponse.json({
      success: false,
      message: err.message
    }, { status: 500 });
  }
}


// =======================
// GENERATOR UTAMA
// =======================
async function generateArticle(data: any) {

  const slug = data.frasaKunci
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, '-');

  const html = `
<article>
  <h1>${data.frasaKunci}</h1>
  <p>Artikel tentang ${data.frasaKunci} dengan internal link:</p>

  <p>
    <a href="${data.url1}">${data.anchorText1}</a> dan 
    <a href="${data.url2}">${data.anchorText2}</a>
  </p>

  <h2>Penjelasan</h2>
  <p>Konten SEO panjang di sini...</p>
</article>
  `;

  return {
    konten: html.trim(),
    judul: data.frasaKunci,
    judul_seo: `${data.frasaKunci} | Primatex`,
    slug,
    meta_deskripsi: `Informasi lengkap tentang ${data.frasaKunci}`,
    kutipan: `Ringkasan ${data.frasaKunci}`,
    tag: `${data.frasaKunci}, geotextile, primatex`
  };
}
