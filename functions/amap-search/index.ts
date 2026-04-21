import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const AMAP_KEY = 'ecd575fe5c5b372ddf1c38c9544fe39e';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  const corsHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  };

  try {
    const { keyword, city = '合肥' } = await req.json();
    
    if (!keyword) {
      return new Response(JSON.stringify({ error: '请输入搜索关键词' }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    const url = `https://restapi.amap.com/v3/assistant/inputtips?key=${AMAP_KEY}&keywords=${encodeURIComponent(keyword)}&city=${encodeURIComponent(city)}&output=JSON`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.status !== '1') {
      return new Response(JSON.stringify({ error: '搜索失败', info: data.info }), {
        status: 500,
        headers: corsHeaders,
      });
    }

    const suggestions = data.tips?.map((tip: any) => ({
      name: tip.name || '',
      address: tip.district || '',
      location: tip.location || '',
      district: tip.district || '',
    })) || [];

    return new Response(JSON.stringify({ suggestions }), {
      headers: corsHeaders,
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message || '未知错误' }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});
