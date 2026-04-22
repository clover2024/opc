import { useEffect } from 'react';
import { supabase } from '../supabase/client';

declare global {
  interface Window {
    wx: any;
  }
}

interface ShareConfig {
  title: string;
  desc: string;
  shareType?: 'community' | 'event' | 'resource';
  shareId?: string;
  imgUrl?: string;
}

const SITE_URL = 'https://opc.sustc.com';
const OG_IMAGE = `${SITE_URL}/logo.png`;
const DEFAULT_SHARE = {
  title: 'OPC合肥 - OPC资源交换与活动平台',
  desc: 'OPC们交换资源，发布合肥本地活动通知的互助社区',
};

let wxLoaded = false;
let wxReady = false;
let pendingShare: { title: string; desc: string; link: string; imgUrl: string } | null = null;

function loadWxSdk(): Promise<void> {
  if (wxLoaded) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://res.wx.qq.com/open/js/jweixin-1.6.0.js';
    script.onload = () => { wxLoaded = true; resolve(); };
    script.onerror = () => reject(new Error('Failed to load WeChat JS-SDK'));
    document.head.appendChild(script);
  });
}

async function initWxConfig() {
  if (wxReady) return;
  if (!window.wx) return;

  const url = window.location.href.split('#')[0];
  const { data, error } = await supabase.functions.invoke('wechat-share', {
    body: { url },
  });

  if (error || !data?.success) {
    console.error('WX sign error:', error || data?.error);
    return;
  }

  const sign = data.data;
  window.wx.config({
    debug: false,
    appId: sign.appId,
    timestamp: sign.timestamp,
    nonceStr: sign.nonceStr,
    signature: sign.signature,
    jsApiList: ['updateAppMessageShareData', 'updateTimelineShareData'],
  });

  window.wx.ready(() => {
    wxReady = true;
    if (pendingShare) {
      applyShareData(pendingShare);
      pendingShare = null;
    }
  });

  window.wx.error((err: any) => {
    console.error('WX config error:', err);
  });
}

function applyShareData(data: { title: string; desc: string; link: string; imgUrl: string }) {
  if (!window.wx) return;
  window.wx.updateAppMessageShareData({
    title: data.title,
    desc: data.desc,
    link: data.link,
    imgUrl: data.imgUrl,
  });
  window.wx.updateTimelineShareData({
    title: data.title,
    link: data.link,
    imgUrl: data.imgUrl,
  });
}

function updateMetaTags(title: string, desc: string, image: string, url: string) {
  const setMeta = (attr: string, val: string, content: string) => {
    let el = document.querySelector(`meta[${attr}="${val}"]`) as HTMLMetaElement;
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute(attr, val);
      document.head.appendChild(el);
    }
    el.content = content;
  };

  document.title = title;
  setMeta('property', 'og:title', title);
  setMeta('property', 'og:description', desc);
  setMeta('property', 'og:image', image);
  setMeta('property', 'og:url', url);
  const descEl = document.querySelector('meta[name="description"]') as HTMLMetaElement;
  if (descEl) descEl.content = desc;
  const twitterTitle = document.querySelector('meta[name="twitter:title"]') as HTMLMetaElement;
  if (twitterTitle) twitterTitle.content = title;
  const twitterDesc = document.querySelector('meta[name="twitter:description"]') as HTMLMetaElement;
  if (twitterDesc) twitterDesc.content = desc;
  const twitterImg = document.querySelector('meta[name="twitter:image"]') as HTMLMetaElement;
  if (twitterImg) twitterImg.content = image;
  const itemName = document.querySelector('meta[itemprop="name"]') as HTMLMetaElement;
  if (itemName) itemName.content = title;
  const itemDesc = document.querySelector('meta[itemprop="description"]') as HTMLMetaElement;
  if (itemDesc) itemDesc.content = desc;
  const itemImg = document.querySelector('meta[itemprop="image"]') as HTMLMetaElement;
  if (itemImg) itemImg.content = image;
}

export function useWechatShare(config?: Partial<ShareConfig>) {
  const title = config?.title || DEFAULT_SHARE.title;
  const desc = config?.desc || DEFAULT_SHARE.desc;
  const image = config?.imgUrl || OG_IMAGE;
  const link = window.location.href;

  useEffect(() => {
    updateMetaTags(title, desc, image, link);

    const isWechat = /micromessenger/i.test(navigator.userAgent);
    if (!isWechat) return;

    (async () => {
      try {
        await loadWxSdk();
        await initWxConfig();
        const shareData = { title, desc, link, imgUrl: image };
        if (wxReady) {
          applyShareData(shareData);
        } else {
          pendingShare = shareData;
        }
      } catch (e) {
        console.error('WX share setup failed:', e);
      }
    })();
  }, [title, desc, image, link]);
}
