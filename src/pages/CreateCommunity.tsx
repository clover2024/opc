import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../supabase/client';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, MapPin, Loader2, Search, X } from 'lucide-react';

interface AmapSuggestion {
  name: string;
  address: string;
  location: string;
  district: string;
}

export default function CreateCommunity() {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<AmapSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    contact_name: '',
    contact_phone: '',
    contact_wechat: '',
    description: '',
    latitude: '',
    longitude: ''
  });

  useEffect(() => {
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }
    
    if (searchQuery.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    
    searchTimeout.current = setTimeout(() => {
      searchAmap(searchQuery);
    }, 300);
    
    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, [searchQuery]);

  const searchAmap = async (keyword: string) => {
    setLoadingSuggestions(true);
    try {
      const { data, error } = await supabase.functions.invoke('amap-search', {
        body: { keyword, city: '合肥' }
      });
      
      if (error) throw error;
      
      if (data?.suggestions) {
        setSuggestions(data.suggestions);
        setShowSuggestions(true);
      }
    } catch (err) {
      console.error('搜索失败:', err);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const selectSuggestion = (suggestion: AmapSuggestion) => {
    setFormData(prev => ({
      ...prev,
      address: suggestion.address + suggestion.name,
      name: suggestion.name
    }));
    
    if (suggestion.location) {
      const [lng, lat] = suggestion.location.split(',');
      setFormData(prev => ({
        ...prev,
        latitude: lat || '',
        longitude: lng || ''
      }));
    }
    
    setSearchQuery('');
    setShowSuggestions(false);
    setSuggestions([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.address.trim()) {
      setError('请填写社区名称和地址');
      return;
    }

    setSaving(true);
    setError('');

    const { error: insertError } = await supabase
      .from('communities')
      .insert({
        name: formData.name,
        address: formData.address,
        contact_name: formData.contact_name,
        contact_phone: formData.contact_phone,
        contact_wechat: formData.contact_wechat,
        description: formData.description,
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null
      });

    setSaving(false);
    if (insertError) {
      setError('发布失败：' + insertError.message);
    } else {
      navigate('/communities');
    }
  };

  if (!isAdmin) {
    return (
      <div className="text-center py-16">
        <p className="text-red-600">只有管理员可以发布社区</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto"
    >
      <button
        onClick={() => navigate('/communities')}
        className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        返回社区地图
      </button>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-6">发布社区</h1>

        {error && (
          <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-lg">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              <MapPin className="w-4 h-4 inline mr-1" />
              搜索地址（高德地图）
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-10 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                placeholder="输入地址搜索，如：合肥政务区"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setShowSuggestions(false);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-auto">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => selectSuggestion(suggestion)}
                    className="w-full px-4 py-3 text-left hover:bg-slate-50 border-b border-slate-100 last:border-0"
                  >
                    <div className="font-medium text-slate-900">{suggestion.name}</div>
                    <div className="text-sm text-slate-500">{suggestion.address}</div>
                  </button>
                ))}
              </div>
            )}
            
            {loadingSuggestions && (
              <div className="absolute right-3 top-[38px]">
                <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              社区名称
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
              placeholder="请输入社区名称"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              详细地址
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
              placeholder="请输入详细地址"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">联系人</label>
              <input
                type="text"
                value={formData.contact_name}
                onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                placeholder="姓名"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">联系电话</label>
              <input
                type="text"
                value={formData.contact_phone}
                onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                placeholder="电话"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">联系微信</label>
            <input
              type="text"
              value={formData.contact_wechat}
              onChange={(e) => setFormData({ ...formData, contact_wechat: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
              placeholder="微信号"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">社区描述</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none resize-none"
              placeholder="社区简介..."
            />
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={() => navigate('/communities')}
              className="flex-1 py-3 border border-slate-200 text-slate-700 rounded-xl font-medium hover:bg-slate-50"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {saving ? '发布中...' : '发布社区'}
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
}
