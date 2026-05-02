export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Harus POST" });
  }

  try {
    const payload = req.body;

    const response = await fetch(
      "https://script.google.com/macros/s/XXXX/exec",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      }
    );

    const result = await response.text();

    return res.status(200).json({
      success: true,
      result
    });

  } catch (err) {
    return res.status(500).json({
      error: err.message
    });
  }
}
