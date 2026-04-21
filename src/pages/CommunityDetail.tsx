import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../supabase/client';
import { ArrowLeft, MapPin, Phone, User, MessageCircle, Building2 } from 'lucide-react';
import { useWechatShare } from '../hooks/useWechatShare';

interface Community {
  id: string;
  name: string;
  address: string;
  contact_name: string | null;
  contact_phone: string | null;
  contact_wechat: string | null;
  description: string | null;
}

export default function CommunityDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [community, setCommunity] = useState<Community | null>(null);
  const [loading, setLoading] = useState(true);

  useWechatShare(community ? {
    title: `${community.name} - OPC合肥社区`,
    desc: community.description || `${community.name}，位于${community.address}`
  } : undefined);

  useEffect(() => {
    if (id) fetchCommunity();
  }, [id]);

  const fetchCommunity = async () => {
    const { data, error } = await supabase
      .from('communities')
      .select('*')
      .eq('id', id)
      .eq('status', 'active')
      .single();
    
    if (!error && data) {
      setCommunity(data);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!community) {
    return (
      <div className="text-center py-16">
        <p className="text-slate-500">社区不存在或已被删除</p>
        <button onClick={() => navigate('/communities')} className="mt-4 text-blue-600 hover:text-blue-700">
          返回社区地图
        </button>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto">
      <button onClick={() => navigate('/communities')} className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6">
        <ArrowLeft className="w-4 h-4" />
        返回社区地图
      </button>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        <div className="flex items-start gap-4 mb-6">
          <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-2xl flex items-center justify-center">
            <Building2 className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{community.name}</h1>
            <p className="text-slate-500 flex items-center gap-1 mt-1">
              <MapPin className="w-4 h-4" />
              {community.address}
            </p>
          </div>
        </div>

        {community.description && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-slate-700 mb-2">社区介绍</h3>
            <p className="text-slate-600 whitespace-pre-wrap">{community.description}</p>
          </div>
        )}

        <div className="border-t border-slate-100 pt-6 space-y-4">
          <h3 className="text-sm font-medium text-slate-700">联系方式</h3>
          
          {community.contact_name && (
            <div className="flex items-center gap-3 text-slate-600">
              <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center">
                <User className="w-5 h-5 text-slate-400" />
              </div>
              <div>
                <p className="text-xs text-slate-400">联系人</p>
                <p className="font-medium">{community.contact_name}</p>
              </div>
            </div>
          )}

          {community.contact_phone && (
            <div className="flex items-center gap-3 text-slate-600">
              <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center">
                <Phone className="w-5 h-5 text-slate-400" />
              </div>
              <div>
                <p className="text-xs text-slate-400">联系电话</p>
                <p className="font-medium">{community.contact_phone}</p>
              </div>
            </div>
          )}

          {community.contact_wechat && (
            <div className="flex items-center gap-3 text-slate-600">
              <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-slate-400" />
              </div>
              <div>
                <p className="text-xs text-slate-400">微信号</p>
                <p className="font-medium">{community.contact_wechat}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
