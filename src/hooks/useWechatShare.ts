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
  link: string;
  imgUrl: string;
}

export function useWechatShare(config?: Partial<ShareConfig>) {
  useEffect(() => {
    const initWechatShare = async () => {
      const isWechat = /MicroMessenger/i.test(navigator.userAgent);
      if (!isWechat) return;

      try {
        const { data } = await supabase.functions.invoke('wechat-share', {
          body: {
            url: window.location.href,
            title: config?.title,
            description: config?.desc,
            image: config?.imgUrl
          }
        });

        if (data?.success && window.wx) {
          const shareConfig = {
            ...data.data,
            success: () => console.log('分享成功'),
            cancel: () => console.log('分享取消')
          };

          window.wx.ready(() => {
            window.wx.onMenuShareTimeline(shareConfig);
            window.wx.onMenuShareAppMessage(shareConfig);
          });
        }
      } catch (err) {
        console.error('微信分享初始化失败:', err);
      }
    };

    initWechatShare();
  }, [config?.title, config?.desc, config?.imgUrl]);
}
