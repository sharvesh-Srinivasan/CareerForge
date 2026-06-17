// content.js — CareerForge Clipper
// Runs on every page at document_idle

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getPageContent') {
    const rawText = document.body.innerText
      .substring(0, 3000)
      .replace(/\s+/g, ' ')
      .trim();

    sendResponse({
      title: document.title,
      url: window.location.href,
      content: rawText,
    });
  }
  // Must return true for async usage, but this is sync — fine as-is
  return false;
});

// Listen for messages from the CareerForge web app (e.g., login/logout)
window.addEventListener('message', (event) => {
  // Only accept messages from the same window
  if (event.source !== window) return;

  if (event.data.type === 'CAREERFORGE_LOGIN') {
    chrome.runtime.sendMessage({
      action: 'saveToken',
      token: event.data.token,
      user: event.data.user
    });
  } else if (event.data.type === 'CAREERFORGE_LOGOUT') {
    chrome.runtime.sendMessage({ action: 'clearToken' });
  }
});
