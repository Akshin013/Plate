const PROFILE_HEADERS = [
  'username',
  'name',
  'car_brand',
  'car_model',
  'plate',
  'avatar',
  'video',
  'instagram',
  'telegram',
  'tiktok',
  'youtube',
  'active',
  'views',
  'last_viewed',
];

export async function appendProfile(profile) {
  const url = process.env.GOOGLE_APPS_SCRIPT_URL?.trim();
  const token = process.env.GOOGLE_APPS_SCRIPT_TOKEN;

  if (!url || !token) {
    throw new Error('Google Apps Script is not configured');
  }

  let response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, profile }),
      cache: 'no-store',
      redirect: 'follow',
      signal: AbortSignal.timeout(20_000),
    });
  } catch (error) {
    throw new Error(`Could not reach Google Apps Script: ${error.message}`);
  }

  const responseText = await response.text();
  let result;
  try {
    result = JSON.parse(responseText);
  } catch {
    if (responseText.includes('accounts.google.com') || responseText.includes('ServiceLogin')) {
      throw new Error('Google Apps Script requires sign-in. Redeploy it as a web app accessible to Anyone.');
    }
    throw new Error(
      `Google Apps Script returned a non-JSON response (HTTP ${response.status}). Check the web app deployment URL and deploy the latest script version.`,
    );
  }

  if (!response.ok || !result.ok) {
    if (result.code === 'DUPLICATE_USERNAME') return false;

    if (result.code === 'INVALID_HEADERS') {
      throw new Error(
        `Google Sheet header row must be: ${PROFILE_HEADERS.join(', ')}`
      );
    }

    throw new Error(
      `Google Apps Script failed${result.code ? ` (${result.code})` : ''}: ${result.error || response.status}`
    );
  }

  return true;
}