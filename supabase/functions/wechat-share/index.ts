import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const APP_ID = Deno.env.get('WECHAT_APP_ID') || '';
const APP_SECRET = Deno.env.get('WECHAT_APP_SECRET') || '';

// Cache access_token and jsapi_ticket
let tokenCache = { token: '', expires: 0 };
let ticketCache = { ticket: '', expires: 0 };

async function getAccessToken(): Promise<string> {
  if (tokenCache.token && Date.now() < tokenCache.expires) {
    return tokenCache.token;
  }
  const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${APP_ID}&secret=${APP_SECRET}`;
  const res = await fetch(url);
  const data = await res.json();
  if (!data.access_token) throw new Error('Failed to get access_token: ' + JSON.stringify(data));
  tokenCache = { token: data.access_token, expires: Date.now() + (data.expires_in - 300) * 1000 };
  return data.access_token;
}

async function getJsapiTicket(): Promise<string> {
  if (ticketCache.ticket && Date.now() < ticketCache.expires) {
    return ticketCache.ticket;
  }
  const token = await getAccessToken();
  const url = `https://api.weixin.qq.com/cgi-bin/ticket/getticket?access_token=${token}&type=jsapi`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.errcode !== 0) throw new Error('Failed to get jsapi_ticket: ' + JSON.stringify(data));
  ticketCache = { ticket: data.ticket, expires: Date.now() + (data.expires_in - 300) * 1000 };
  return data.ticket;
}

function sha1(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  return crypto.subtle.digest('SHA-1', data).then(buf => {
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
  });
}

function generateNonceStr(): string {
  return Math.random().toString(36).slice(2, 15);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  };

  try {
    if (!APP_ID || !APP_SECRET) {
      return new Response(JSON.stringify({ success: false, error: 'Missing WECHAT_APP_ID or WECHAT_APP_SECRET' }), { status: 500, headers });
    }

    const { url } = await req.json();
    if (!url) {
      return new Response(JSON.stringify({ success: false, error: 'Missing url parameter' }), { status: 400, headers });
    }

    const ticket = await getJsapiTicket();
    const nonceStr = generateNonceStr();
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const signature = await sha1(`jsapi_ticket=${ticket}&noncestr=${nonceStr}&timestamp=${timestamp}&url=${url}`);

    return new Response(JSON.stringify({
      success: true,
      data: {
        appId: APP_ID,
        timestamp,
        nonceStr,
        signature
      }
    }), { headers });
  } catch (error: any) {
    return new Response(JSON.stringify({
      success: false,
      error: error?.message || 'Unknown error'
    }), { status: 500, headers });
  }
});
