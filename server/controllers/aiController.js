const extractDetails = async (req, res) => {
  try {
    const { content, title, url } = req.body;

    if (!content || !title) {
      return res.status(400).json({
        success: false,
        message: 'Content and title are required for extraction',
      });
    }

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_API_KEY) {
      return res.status(500).json({
        success: false,
        message: 'Gemini API key is not configured on the server',
      });
    }

    const prompt = `You are extracting job/hackathon/internship details from a webpage. Extract and return ONLY a valid JSON object with these exact fields. If a field cannot be found, set it to null. Do not return any text, explanation, or markdown outside the JSON object.

{
  "company_name": "company or organiser name",
  "role": "job title, internship role, or hackathon name",
  "location": "city or Remote or Online or null",
  "package": "salary or stipend as a string or null",
  "deadline": "application deadline as YYYY-MM-DD or null",
  "type": "one of exactly: Job / Internship / Hackathon / OA / Fellowship",
  "application_link": "${url || ''}"
}

Page Title: ${title}

Page Content:
${content}`;

    let response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.1 }
      }),
    });

    // Fallback if the primary model is overloaded
    if (response.status === 503 || response.status === 429) {
      response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.1 }
        }),
      });
    }

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini API error ${response.status}: ${errText}`);
    }

    const data = await response.json();
    let text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Gemini sometimes returns json block markers
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();

    let extractedData;
    try {
      extractedData = JSON.parse(text);
    } catch {
      // Try to extract JSON from any surrounding text
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        extractedData = JSON.parse(match[0]);
      } else {
        throw new Error('Could not parse AI response as JSON');
      }
    }

    res.status(200).json({
      success: true,
      data: extractedData,
    });
  } catch (error) {
    console.error('Extraction Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error extracting details',
    });
  }
};

module.exports = {
  extractDetails,
};
