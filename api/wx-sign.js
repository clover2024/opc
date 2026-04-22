const APPID = process.env.WX_APPID || '';
const APPSECRET = process.env.WX_APPSECRET || '';

let tokenCache = { value: '', expire: 0 };
let ticketCache = { value: '', expire: 0 };

async function getAccessToken() {
  const now = Date.now();
  if (tokenCache.value && now < tokenCache.expire) return tokenCache.value;
  const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${APPID}&secret=${APPSECRET}`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.errcode) throw new Error(`getAccessToken: ${data.errmsg}`);
  tokenCache = { value: data.access_token, expire: now + (data.expires_in - 300) * 1000 };
  return data.access_token;
}

async function getJsApiTicket() {
  const now = Date.now();
  if (ticketCache.value && now < ticketCache.expire) return ticketCache.value;
  const token = await getAccessToken();
  const url = `https://api.weixin.qq.com/cgi-bin/ticket/getticket?access_token=${token}&type=jsapi`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.errcode !== 0) throw new Error(`getTicket: ${data.errmsg}`);
  ticketCache = { value: data.ticket, expire: now + (data.expires_in - 300) * 1000 };
  return data.ticket;
}

function sign(ticket, nonceStr, timestamp, url) {
  const str = `jsapi_ticket=${ticket}&noncestr=${nonceStr}&timestamp=${timestamp}&url=${url}`;
  const crypto = require('crypto');
  return crypto.createHash('sha1').update(str).digest('hex');
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Cache-Control', 'no-cache');

  if (req.method === 'OPTIONS') return res.status(204).end();

  const url = req.query?.url || '';
  if (!url) return res.status(400).json({ error: 'missing url' });

  try {
    const ticket = await getJsApiTicket();
    const nonceStr = Math.random().toString(36).slice(2, 15);
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const signature = sign(ticket, nonceStr, timestamp, url);
    res.status(200).json({ appId: APPID, timestamp, nonceStr, signature });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
