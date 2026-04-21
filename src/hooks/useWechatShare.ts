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
  link?: string;
  imgUrl: string;
}

const DEFAULT_SHARE: ShareConfig = {
  title: 'OPC合肥 - OPC资源交换与活动平台',
  desc: 'OPC们交换资源，发布合肥本地活动通知的互助社区',
  imgUrl: 'https://opc.sustc.com/logo.png'
};

function updateMetaTags(config: ShareConfig) {
  const setMeta = (property: string, content: string) => {
    let el = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement;
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute('property', property);
      document.head.appendChild(el);
    }
    el.content = content;
  };

  const setTitle = (selector: string, content: string) => {
    const el = document.querySelector(selector) as HTMLMetaElement;
    if (el) el.content = content;
  };

  document.title = config.title;
  setMeta('og:title', config.title);
  setMeta('og:description', config.desc);
  setMeta('og:image', config.imgUrl);
  setMeta('og:url', config.link || window.location.href);
  setTitle('meta[name="description"]', config.desc);
  setTitle('meta[name="twitter:title"]', config.title);
  setTitle('meta[name="twitter:description"]', config.desc);
  setTitle('meta[name="twitter:image"]', config.imgUrl);
  setTitle('meta[itemprop="name"]', config.title);
  setTitle('meta[itemprop="description"]', config.desc);
  setTitle('meta[itemprop="image"]', config.imgUrl);
}

export function useWechatShare(config?: Partial<ShareConfig>) {
  const merged: ShareConfig = { ...DEFAULT_SHARE, ...config };

  useEffect(() => {
    updateMetaTags(merged);

    const isWechat = /MicroMessenger/i.test(navigator.userAgent);
    if (!isWechat) return;

    const initWechatShare = async () => {
      try {
        const { data } = await supabase.functions.invoke('wechat-share', {
          body: {
            url: window.location.href.split('#')[0],
            title: merged.title,
            description: merged.desc,
            image: merged.imgUrl
          }
        });

        if (data?.success && window.wx) {
          window.wx.ready(() => {
            window.wx.updateAppMessageShareData({
              title: merged.title,
              desc: merged.desc,
              link: merged.link || window.location.href,
              imgUrl: merged.imgUrl
            });
            window.wx.updateTimelineShareData({
              title: merged.title,
              link: merged.link || window.location.href,
              imgUrl: merged.imgUrl
            });
          });
        }
      } catch (err) {
        console.error('微信分享初始化失败:', err);
      }
    };

    initWechatShare();
  }, [merged.title, merged.desc, merged.imgUrl, merged.link]);
}
