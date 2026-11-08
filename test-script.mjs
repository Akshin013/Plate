const url = process.env.GOOGLE_APPS_SCRIPT_URL?.trim();
const token = process.env.GOOGLE_APPS_SCRIPT_TOKEN;
console.log('URL:', url);
console.log('Token length:', token ? token.length : 'НЕТ ТОКЕНА');

const r = await fetch(url, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    token,
    profile: { username: 'test-zzz', name: 'Test', car_brand: 'Test', car_model: 'Test', plate: '00-TT-000' },
  }),
  redirect: 'follow',
});
console.log('HTTP', r.status, r.url);
console.log((await r.text()).slice(0, 400));