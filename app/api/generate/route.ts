export default async function handler(req, res) {
  try {
    const { keyword, anchor1, url1, anchor2, url2 } = req.body;

    // Prompt AI
    const prompt = `
Buat artikel SEO profesional:

Keyword: ${keyword}
Internal Link:
- ${anchor1} (${url1})
- ${anchor2} (${url2})

Output:
1. HTML Content
2. SEO Data JSON:
{
 title,
 titleSeo,
 slug,
 meta,
 excerpt,
 tags[]
}
`;

    // Call Gemini API (pseudo)
    const aiResponse = await fetch("https://api.gemini.com/generate", {
      method: "POST",
      body: JSON.stringify({ prompt })
    });

    const data = await aiResponse.json();

    // Parsing hasil (sesuaikan output AI)
    const html = data.html;
    const seo = data.seo;

    res.status(200).json({
      success: true,
      html,
      seo
    });

  } catch (error) {
    res.status(200).json({
      success: false,
      error: error.message
    });
  }
}
