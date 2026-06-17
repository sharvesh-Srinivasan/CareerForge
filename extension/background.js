// background.js — CareerForge Clipper Service Worker

// ─── Config ──────────────────────────────────────────────────────────────────
// IMPORTANT: Replace with your actual Gemini API key
// Get a FREE key at: https://aistudio.google.com/app/apikey
const GEMINI_API_KEY = 'AIzaSyAIrwaCSXN06HUyNNReXoQtL6ZhcdcBiw8';
const BACKEND_URL = 'http://localhost:4000'; // Change to your production URL when deployed

// ─── Gemini AI Extraction ─────────────────────────────────────────────────────
async function extractWithGemini(content, title, url) {
  const prompt = `You are extracting job/hackathon/internship details from a webpage. Extract and return ONLY a valid JSON object with these exact fields. If a field cannot be found, set it to null. Do not return any text, explanation, or markdown outside the JSON object.

{
  "company_name": "company or organiser name",
  "role": "job title, internship role, or hackathon name",
  "location": "city or Remote or Online or null",
  "package": "salary or stipend as a string or null",
  "deadline": "application deadline as YYYY-MM-DD or null",
  "type": "one of exactly: Job / Internship / Hackathon / OA / Fellowship",
  "application_link": "${url}"
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

  try {
    return JSON.parse(text);
  } catch {
    // Try to extract JSON from any surrounding text
    const match = text.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    throw new Error('Could not parse AI response as JSON');
  }
}

// ─── Save Application ─────────────────────────────────────────────────────────
async function saveApplication(applicationData, token) {
  // Step 1: Save application
  const appResponse = await fetch(`${BACKEND_URL}/api/applications`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      company_name: applicationData.company_name,
      role: applicationData.role,
      location: applicationData.location || null,
      package: applicationData.package || null,
      application_date: new Date().toISOString().split('T')[0],
      deadline: applicationData.deadline || null,
      application_link: applicationData.application_link || null,
      notes: `Added via CareerForge Clipper`,
      status: 'Applied',
    }),
  });

  const appData = await appResponse.json();

  if (!appData.success) {
    throw new Error(appData.message || 'Failed to save application');
  }

  let reminderCreated = false;
  let reminderDate = null;

  // Since the backend now automatically creates the reminder, 
  // we just calculate the date to show in the UI.
  if (applicationData.deadline) {
    const deadlineDate = new Date(applicationData.deadline);
    const rd = new Date(deadlineDate);

    if (rd > new Date()) {
      reminderDate = rd;
      reminderCreated = true;
    }
  }

  return {
    application: appData.data,
    reminderCreated,
    reminderDate: reminderDate ? reminderDate.toISOString() : null,
  };
}

// ─── Message Router ───────────────────────────────────────────────────────────
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'extractDetails') {
    extractWithGemini(request.content, request.title, request.url)
      .then((details) => sendResponse({ success: true, data: details }))
      .catch((err) => sendResponse({ success: false, error: err.message }));
    return true; // Keep channel open for async
  }

  if (request.action === 'saveApplication') {
    saveApplication(request.applicationData, request.token)
      .then((result) => sendResponse({ success: true, data: result }))
      .catch((err) => sendResponse({ success: false, error: err.message }));
    return true;
  }

  if (request.action === 'getToken') {
    chrome.storage.local.get(['cf_token', 'cf_user'], (result) => {
      sendResponse({ token: result.cf_token || null, user: result.cf_user || null });
    });
    return true;
  }

  if (request.action === 'saveToken') {
    chrome.storage.local.set({ cf_token: request.token, cf_user: request.user }, () => {
      sendResponse({ success: true });
    });
    return true;
  }

  if (request.action === 'clearToken') {
    chrome.storage.local.remove(['cf_token', 'cf_user'], () => {
      sendResponse({ success: true });
    });
    return true;
  }
});
