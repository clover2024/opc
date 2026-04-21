import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../supabase/client';
import { useAuth } from '../contexts/AuthContext';
import {
  ArrowLeft,
  Package,
  User,
  Calendar,
  Tag,
  MessageCircle,
  Edit,
  Trash2,
  Share2
} from 'lucide-react';
import { useWechatShare, sharePage } from '../hooks/useWechatShare';

interface Resource {
  id: string;
  title: string;
  description: string;
  category: string;
  type: string;
  contact_info: string;
  images: string[];
  status: string;
  created_at: string;
  user_id: string;
}

interface Profile {
  username: string | null;
  avatar_url: string | null;
}

export default function ResourceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [resource, setResource] = useState<Resource | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useWechatShare(resource ? {
    title: `${resource.title} - OPC合肥资源`,
    desc: `[${resource.type}] ${resource.description?.slice(0, 60)}`,
    shareType: 'resource',
    shareId: resource.id
  } : undefined);

  useEffect(() => {
    fetchResource();
  }, [id]);

  const fetchResource = async () => {
    if (!id) return;
    
    const { data: resourceData, error: resourceError } = await supabase
      .from('resources')
      .select('*')
      .eq('id', id)
      .single();
    
    if (resourceError || !resourceData) {
      console.error('Error fetching resource:', resourceError);
      setLoading(false);
      return;
    }

    setResource(resourceData);

    if (resourceData.user_id) {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('username, avatar_url')
        .eq('id', resourceData.user_id)
        .single();
      
      if (profileData) {
        setProfile(profileData);
      }
    }
    
    setLoading(false);
  };

  const handleDelete = async () => {
    if (!resource || !confirm('确定要删除这个资源吗？')) return;
    const { error } = await supabase.from('resources').delete().eq('id', resource.id);
    if (!error) navigate('/resources');
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('zh-CN');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!resource) {
    return (
      <div className="text-center py-16">
        <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-slate-700">资源不存在</h2>
        <Link to="/resources" className="text-blue-600 hover:underline mt-2 inline-block">
          返回资源列表
        </Link>
      </div>
    );
  }

  const isOwner = user?.id === resource.user_id;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <button
        onClick={() => navigate('/resources')}
        className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        返回资源列表
      </button>

      <div className="flex justify-end mb-4">
        <button
          onClick={() => sharePage({ title: resource.title, desc: `[${resource.type}] ${resource.description?.slice(0, 60)}`, shareType: 'resource', shareId: resource.id })}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
        >
          <Share2 className="w-4 h-4" />
          分享
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 md:p-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  resource.type === '提供' 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-orange-100 text-orange-700'
                }`}>
                  {resource.type}
                </span>
                <span className="flex items-center gap-1 text-slate-500 text-sm">
                  <Tag className="w-4 h-4" />
                  {resource.category}
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900">{resource.title}</h1>
            </div>
            {isOwner && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate(`/resources/edit/${resource.id}`)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                >
                  <Edit className="w-5 h-5" />
                </button>
                <button
                  onClick={handleDelete}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4 mb-8 p-4 bg-slate-50 rounded-xl">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="w-12 h-12 rounded-full" />
              ) : (
                <User className="w-6 h-6 text-white" />
              )}
            </div>
            <div>
              <p className="font-medium text-slate-900">{profile?.username || '匿名用户'}</p>
              <p className="text-sm text-slate-500 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                发布于 {formatDate(resource.created_at)}
              </p>
            </div>
          </div>

          <div className="prose max-w-none mb-8">
            <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{resource.description}</p>
          </div>

          {resource.images && resource.images.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
              {resource.images.map((image, index) => (
                <img
                  key={index}
                  src={image}
                  alt={`资源图片 ${index + 1}`}
                  className="w-full h-48 object-cover rounded-xl"
                />
              ))}
            </div>
          )}

          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6">
            <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-blue-600" />
              联系方式
            </h3>
            <p className="text-slate-700">{resource.contact_info || '暂无联系方式'}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
