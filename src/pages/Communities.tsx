import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../supabase/client';
import { useAuth } from '../contexts/AuthContext';
import { MapPin, Phone, User, MessageCircle, Search, Plus, Building2, Edit, Trash2 } from 'lucide-react';

interface Community {
  id: string;
  name: string;
  address: string;
  contact_name: string | null;
  contact_phone: string | null;
  contact_wechat: string | null;
  description: string | null;
}

export default function Communities() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [filtered, setFiltered] = useState<Community[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchCommunities();
  }, []);

  useEffect(() => {
    const term = search.toLowerCase();
    setFiltered(communities.filter(c =>
      c.name.toLowerCase().includes(term) ||
      c.address.toLowerCase().includes(term)
    ));
  }, [search, communities]);

  const fetchCommunities = async () => {
    const { data } = await supabase
      .from('communities')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false });
    setCommunities(data || []);
    setFiltered(data || []);
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个社区吗？此操作不可恢复。')) return;
    setDeletingId(id);
    const { error } = await supabase
      .from('communities')
      .update({ status: 'deleted', updated_at: new Date().toISOString() })
      .eq('id', id);
    setDeletingId(null);
    if (!error) {
      fetchCommunities();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">OPC社区地图</h1>
          <p className="text-slate-500 mt-1">合肥市各社区地址与联系人信息</p>
        </div>
        {isAdmin && (
          <Link
            to="/communities/create"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            新增社区
          </Link>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="搜索社区名称或地址..."
          className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <Building2 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">暂无社区信息</p>
          <p className="text-slate-400 text-sm mt-2">社区入驻请联系管理员微信：opchefei</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((c) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => navigate(`/communities/${c.id}`)}
              className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow relative cursor-pointer"
            >
              {isAdmin && (
                <div className="absolute top-4 right-4 flex gap-1" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => navigate(`/communities/edit/${c.id}`)}
                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="编辑"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(c.id)}
                    disabled={deletingId === c.id}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                    title="删除"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">{c.name}</h3>
                  <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
                    <MapPin className="w-3 h-3" />
                    {c.address}
                  </p>
                </div>
              </div>

              {c.description && (
                <p className="text-sm text-slate-600 mb-4 line-clamp-2">{c.description}</p>
              )}

              <div className="space-y-2 text-sm">
                {c.contact_name && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <User className="w-4 h-4 text-slate-400" />
                    <span>联系人：{c.contact_name}</span>
                  </div>
                )}
                {c.contact_phone && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <Phone className="w-4 h-4 text-slate-400" />
                    <span>{c.contact_phone}</span>
                  </div>
                )}
                {c.contact_wechat && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <MessageCircle className="w-4 h-4 text-slate-400" />
                    <span>微信：{c.contact_wechat}</span>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
