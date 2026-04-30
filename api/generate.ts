export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const body = req.body;

    return res.status(200).json({
      message: "API OK",
      received: body
    });

  } catch (err) {
    return res.status(500).json({
      error: err.message
    });
  }
}
