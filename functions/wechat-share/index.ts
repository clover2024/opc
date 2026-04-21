import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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
    const { url, title, description, image } = await req.json();
    
    const shareConfig = {
      title: title || 'OPC合肥 - OPC资源交换与活动平台',
      desc: description || 'OPC们交换资源，发布合肥本地活动通知的互助社区',
      link: url || 'https://hefei.meoo.fun',
      imgUrl: image || 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=300&h=300&fit=crop',
      success: function() {
        console.log('分享成功');
      },
      cancel: function() {
        console.log('分享取消');
      }
    };

    return new Response(JSON.stringify({
      success: true,
      data: shareConfig
    }), { headers: corsHeaders });
  } catch (error: any) {
    return new Response(JSON.stringify({
      success: false,
      error: error?.message || 'Unknown error'
    }), {
      status: 400,
      headers: corsHeaders,
    });
  }
});
