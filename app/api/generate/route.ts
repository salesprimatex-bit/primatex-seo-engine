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

    const result = await generateRobust(body);

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


// =============================
// MAIN ROBUST GENERATOR
// =============================
async function generateRobust(data: any) {
  let lastError = '';

  // 🔁 RETRY 3x
  for (let i = 0; i < 3; i++) {
    try {
      const result = await callGemini(data);
      const valid = validateResult(result);

      if (valid) return result;

      lastError = 'Format tidak valid';
    } catch (err: any) {
      lastError = err.message;
    }
  }

  // 🆘 FALLBACK
  return fallbackGenerator(data, lastError);
}


// =============================
// GEMINI CALL
// =============================
async function callGemini(data: any) {
  const prompt = `
BALAS HANYA JSON VALID TANPA PENJELASAN.

{
  "konten": "",
  "judul": "",
  "judul_seo": "",
  "slug": "",
  "meta_deskripsi": "",
  "kutipan": "",
  "tag": ""
}

Topik: ${data.frasaKunci}
Gunakan internal link:
- ${data.anchorText1} (${data.url1})
- ${data.anchorText2} (${data.url2})
`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    }
  );

  const json = await res.json();

  const raw = json?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!raw) throw new Error('Gemini kosong');

  const cleaned = cleanJSON(raw);

  return JSON.parse(cleaned);
}


// =============================
// CLEANER (ANTI ERROR)
// =============================
function cleanJSON(text: string) {
  return text
    .replace(/```json/g, '')
    .replace(/```/g, '')
    .replace(/\n/g, ' ')
    .trim();
}


// =============================
// VALIDATOR
// =============================
function validateResult(obj: any) {
  return (
    obj &&
    obj.konten &&
    obj.judul &&
    obj.slug &&
    obj.meta_deskripsi
  );
}


// =============================
// FALLBACK GENERATOR (ANTI FAIL)
// =============================
function fallbackGenerator(data: any, error: string) {

  const slug = data.frasaKunci
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, '-');

  return {
    konten: `
<article>
<h1>${data.frasaKunci}</h1>
<p>Konten fallback karena AI error: ${error}</p>
<p>
<a href="${data.url1}">${data.anchorText1}</a> |
<a href="${data.url2}">${data.anchorText2}</a>
</p>
</article>
    `,
    judul: data.frasaKunci,
    judul_seo: `${data.frasaKunci} | Primatex`,
    slug,
    meta_deskripsi: `Artikel tentang ${data.frasaKunci}`,
    kutipan: `Ringkasan ${data.frasaKunci}`,
    tag: `${data.frasaKunci}, geotextile`,
  };
}
