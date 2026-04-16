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

    const result = await generateWithGemini({
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
// GEMINI GENERATOR
// =======================
async function generateWithGemini(data: any) {

  const prompt = `
Buat artikel SEO lengkap dalam format JSON.

OUTPUT WAJIB JSON VALID TANPA PENJELASAN:

{
  "konten": "HTML artikel lengkap",
  "judul": "",
  "judul_seo": "",
  "slug": "",
  "meta_deskripsi": "",
  "kutipan": "",
  "tag": ""
}

DATA:
- Frasa Kunci: ${data.frasaKunci}
- Anchor 1: ${data.anchorText1} (${data.url1})
- Anchor 2: ${data.anchorText2} (${data.url2})

Aturan:
- konten harus HTML
- gunakan internal link di anchor
- panjang 1000+ kata
- slug pakai dash
`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }]
          }
        ]
      })
    }
  );

  const json = await response.json();

  // 🔥 DEBUG (WAJIB kalau error)
  console.log(JSON.stringify(json));

  const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error('Response Gemini kosong');
  }

  // 🔥 Bersihin jika Gemini nambah ```json
  const cleaned = text
    .replace(/```json/g, '')
    .replace(/```/g, '')
    .trim();

  let parsed;

  try {
    parsed = JSON.parse(cleaned);
  } catch (e) {
    throw new Error('JSON tidak valid dari Gemini:\n' + cleaned);
  }

  return parsed;
}
