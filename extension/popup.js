// popup.js — CareerForge Clipper

const CAREERFORGE_URL = 'http://localhost:5173'; // Change to your production URL

// ─── State helpers ─────────────────────────────────────────────────────────────
const states = ['login', 'loading', 'extracted', 'success', 'error'];

function showState(name) {
  states.forEach((s) => {
    const el = document.getElementById(`state-${s}`);
    if (el) el.classList.toggle('active', s === name);
  });
}

function showToast(msg, duration = 2500) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), duration);
}

// ─── DOM refs ──────────────────────────────────────────────────────────────────
const btnLogout   = document.getElementById('btn-logout');
const btnLogin    = document.getElementById('btn-login');
const btnSave     = document.getElementById('btn-save');
const btnRetry    = document.getElementById('btn-retry');
const btnManual   = document.getElementById('btn-manual');
const btnView     = document.getElementById('btn-view');
const cbReminder  = document.getElementById('cb-reminder');
const cbWhatsapp  = document.getElementById('cb-whatsapp');
const rowWhatsapp = document.getElementById('row-whatsapp');

// Form fields
const fCompany  = document.getElementById('f-company');
const fRole     = document.getElementById('f-role');
const fType     = document.getElementById('f-type');
const fLocation = document.getElementById('f-location');
const fPackage  = document.getElementById('f-package');
const fDeadline = document.getElementById('f-deadline');
const fLink     = document.getElementById('f-link');

// ─── Stored auth ───────────────────────────────────────────────────────────────
let currentToken = null;
let currentUser  = null;

// ─── Populate form ─────────────────────────────────────────────────────────────
function populateForm(details) {
  fCompany.value  = details.company_name || '';
  fRole.value     = details.role         || '';
  fLocation.value = details.location     || '';
  fPackage.value  = details.package      || '';
  fLink.value     = details.application_link || '';

  // Type select
  const typeMap = {
    job: 'Job', internship: 'Internship',
    hackathon: 'Hackathon', oa: 'OA', fellowship: 'Fellowship',
  };
  const detectedType = typeMap[(details.type || '').toLowerCase()] || 'Job';
  fType.value = detectedType;

  // Deadline — must be YYYY-MM-DD for input[type=date]
  if (details.deadline) {
    try {
      const d = new Date(details.deadline);
      if (!isNaN(d)) {
        fDeadline.value = d.toISOString().split('T')[0];
      }
    } catch { /* ignore */ }
  }
}

// ─── Extract flow ──────────────────────────────────────────────────────────────
async function runExtraction() {
  showState('loading');

  try {
    // 1. Get current tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.id) throw new Error('No active tab found');

    // 2. Get page content from content script
    let pageData;
    try {
      pageData = await chrome.tabs.sendMessage(tab.id, { action: 'getPageContent' });
    } catch {
      // Content script might not be injected on chrome:// pages etc.
      throw new Error('Cannot read this page. Try a regular website.');
    }

    if (!pageData || !pageData.content) {
      throw new Error('Could not read page content');
    }

    // 3. Call Claude via background
    const extractRes = await chrome.runtime.sendMessage({
      action: 'extractDetails',
      content: pageData.content,
      title:   pageData.title,
      url:     pageData.url,
    });

    if (!extractRes.success) {
      throw new Error(extractRes.error || 'AI extraction failed');
    }

    // 4. Populate form
    populateForm(extractRes.data);

    // Show WhatsApp option only if user is subscribed
    if (currentUser && currentUser.whatsapp_subscribed) {
      rowWhatsapp.style.display = 'flex';
    }

    showState('extracted');

  } catch (err) {
    document.getElementById('error-detail').textContent = err.message;
    showState('error');
  }
}

// ─── Save flow ─────────────────────────────────────────────────────────────────
async function handleSave() {
  const company = fCompany.value.trim();
  const role    = fRole.value.trim();

  // Validation
  fCompany.classList.toggle('error', !company);
  fRole.classList.toggle('error', !role);
  if (!company || !role) {
    showToast('Company and Role are required');
    return;
  }

  // Build payload
  const applicationData = {
    company_name:     company,
    role:             role,
    location:         fLocation.value.trim() || null,
    package:          fPackage.value.trim()  || null,
    deadline:         fDeadline.value        || null,
    application_link: fLink.value.trim()     || null,
    type:             fType.value,
    createReminder:   cbReminder.checked,
    sendWhatsApp:     cbWhatsapp.checked,
  };

  // Spinner on button
  btnSave.disabled = true;
  btnSave.innerHTML = '<div class="btn-spinner"></div> Saving...';

  try {
    const saveRes = await chrome.runtime.sendMessage({
      action: 'saveApplication',
      applicationData,
      token: currentToken,
    });

    if (!saveRes.success) throw new Error(saveRes.error || 'Save failed');

    const { application, reminderCreated, reminderDate } = saveRes.data;

    // Show success state
    document.getElementById('success-detail').textContent =
      `${application.company_name} — ${application.role} added to your applications.`;

    const reminderEl = document.getElementById('success-reminder');
    if (reminderCreated && reminderDate) {
      const dateStr = new Date(reminderDate).toLocaleDateString('en-IN', {
        day: 'numeric', month: 'long', year: 'numeric',
      });
      reminderEl.textContent = `🔔 Reminder set for ${dateStr}`;
      reminderEl.style.display = 'inline-block';
    } else {
      reminderEl.style.display = 'none';
    }

    showState('success');

  } catch (err) {
    showToast(`❌ ${err.message}`);
    btnSave.disabled = false;
    btnSave.innerHTML = 'Add to CareerForge';
  }
}

// ─── Init ──────────────────────────────────────────────────────────────────────
async function init() {
  // Get stored auth
  const authRes = await chrome.runtime.sendMessage({ action: 'getToken' });
  currentToken = authRes.token;
  currentUser  = authRes.user;

  if (!currentToken) {
    showState('login');
    btnLogout.style.display = 'none';
  } else {
    btnLogout.style.display = 'block';
    runExtraction();
  }
}

// ─── Event Listeners ───────────────────────────────────────────────────────────

btnLogin.addEventListener('click', () => {
  chrome.tabs.create({ url: `${CAREERFORGE_URL}/login` });

  // Poll storage for token after user logs in
  const poll = setInterval(async () => {
    const authRes = await chrome.runtime.sendMessage({ action: 'getToken' });
    if (authRes.token) {
      clearInterval(poll);
      currentToken = authRes.token;
      currentUser  = authRes.user;
      btnLogout.style.display = 'block';
      runExtraction();
    }
  }, 1500);

  // Stop polling after 2 minutes
  setTimeout(() => clearInterval(poll), 120000);
});

btnLogout.addEventListener('click', async () => {
  await chrome.runtime.sendMessage({ action: 'clearToken' });
  currentToken = null;
  currentUser  = null;
  btnLogout.style.display = 'none';
  showState('login');
  showToast('Logged out');
});

btnSave.addEventListener('click', handleSave);

btnRetry.addEventListener('click', () => {
  if (currentToken) {
    runExtraction();
  } else {
    showState('login');
  }
});

btnManual.addEventListener('click', () => {
  chrome.tabs.create({ url: `${CAREERFORGE_URL}/applications?add=true` });
});

btnView.addEventListener('click', () => {
  chrome.tabs.create({ url: `${CAREERFORGE_URL}/applications` });
});

// Clear validation errors on input
[fCompany, fRole].forEach((el) => {
  el.addEventListener('input', () => el.classList.remove('error'));
});

// ─── Boot ──────────────────────────────────────────────────────────────────────
init();
