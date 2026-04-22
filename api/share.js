const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

const SITE_URL = 'https://opc.sustc.com';
const OG_IMAGE = `${SITE_URL}/logo.png`;
const DEFAULT_TITLE = 'OPC合肥 - OPC资源交换与活动平台';
const DEFAULT_DESC = 'OPC们交换资源，发布合肥本地活动通知的互助社区';

function html(title, desc, image, redirect) {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title>
<meta name="description" content="${desc}">
<meta itemprop="name" content="${title}">
<meta itemprop="description" content="${desc}">
<meta itemprop="image" content="${image}">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${desc}">
<meta property="og:image" content="${image}">
<meta property="og:url" content="${redirect}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="OPC合肥">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${title}">
<meta name="twitter:description" content="${desc}">
<meta name="twitter:image" content="${image}">
</head>
<body>
<script>window.location.replace("${redirect}");</script>
<noscript><meta http-equiv="refresh" content="0;url=${redirect}"></noscript>
<a href="${redirect}">正在跳转...</a>
</body>
</html>`;
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(204).end();

  const type = req.query?.type;
  const id = req.query?.id;

  if (!type || !id) {
    return res.status(200).send(html(DEFAULT_TITLE, DEFAULT_DESC, OG_IMAGE, `${SITE_URL}/`));
  }

  let title = DEFAULT_TITLE;
  let desc = DEFAULT_DESC;
  const redirect = `${SITE_URL}/#/${type}s/${id}`;

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    if (type === 'community') {
      const { data } = await supabase.from('communities').select('name,address,description').eq('id', id).single();
      if (data) {
        title = `${data.name} - OPC合肥社区`;
        desc = data.description || `${data.name}，位于${data.address}`;
      }
    } else if (type === 'event') {
      const { data } = await supabase.from('events').select('title,location,event_date').eq('id', id).single();
      if (data) {
        title = `${data.title} - OPC合肥活动`;
        desc = `${data.location} | ${new Date(data.event_date).toLocaleDateString('zh-CN')}`;
      }
    } else if (type === 'resource') {
      const { data } = await supabase.from('resources').select('title,type,description').eq('id', id).single();
      if (data) {
        title = `${data.title} - OPC合肥资源`;
        desc = `[${data.type}] ${(data.description || '').slice(0, 80)}`;
      }
    }
  } catch (e) {
    // fallback to defaults
  }

  res.status(200).send(html(title, desc, OG_IMAGE, redirect));
};
