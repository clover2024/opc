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

function getShareLink(config?: Partial<ShareConfig>): string {
  if (config?.shareType && config?.shareId) {
    return `${SITE_URL}/api/share?type=${config.shareType}&id=${config.shareId}`;
  }
  return window.location.href;
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
  const link = getShareLink(config);

  useEffect(() => {
    updateMetaTags(title, desc, image, link);

    const isWechat = /MicroMessenger/i.test(navigator.userAgent);
    if (!isWechat || !window.wx) return;

    const initWechatShare = async () => {
      try {
        // 1. Get signing data from backend
        const { data, error } = await supabase.functions.invoke('wechat-share', {
          body: { url: window.location.href.split('#')[0] }
        });

        if (error || !data?.success) {
          console.error('微信签名失败:', error || data);
          return;
        }

        // 2. Call wx.config to initialize JS-SDK
        window.wx.config({
          debug: false,
          appId: data.data.appId,
          timestamp: data.data.timestamp,
          nonceStr: data.data.nonceStr,
          signature: data.data.signature,
          jsApiList: [
            'updateAppMessageShareData',
            'updateTimelineShareData'
          ]
        });

        // 3. After config is ready, set share data
        window.wx.ready(() => {
          window.wx.updateAppMessageShareData({
            title,
            desc,
            link,
            imgUrl: image
          });
          window.wx.updateTimelineShareData({
            title,
            link,
            imgUrl: image
          });
        });

        window.wx.error((res: any) => {
          console.error('微信JS-SDK配置失败:', res);
        });
      } catch (err) {
        console.error('微信分享初始化失败:', err);
      }
    };

    initWechatShare();
  }, [title, desc, image, link]);
}
