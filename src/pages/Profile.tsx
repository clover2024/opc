import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../supabase/client';
import { Package, Calendar, CheckCircle, User, MapPin, Mail, Edit, Lock } from 'lucide-react';

interface ProfileData {
  id: string;
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
  location: string | null;
}

interface Resource {
  id: string;
  title: string;
  type: string;
  category: string;
  status: string;
  created_at: string;
}

interface Event {
  id: string;
  title: string;
  event_date: string;
  location: string;
  status: string;
}

interface Registration {
  id: string;
  event: Event;
  status: string;
}

export default function Profile() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [myResources, setMyResources] = useState<Resource[]>([]);
  const [myEvents, setMyEvents] = useState<Event[]>([]);
  const [myRegistrations, setMyRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ current: '', new: '', confirm: '' });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({ username: '', bio: '' });
  const [editError, setEditError] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
      return;
    }
    if (user) {
      loadProfileData();
    }
  }, [user, authLoading, navigate]);

  const loadProfileData = async () => {
    if (!user) return;
    
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (profileData) setProfile(profileData);

    const { data: resources } = await supabase
      .from('resources')
      .select('id, title, type, category, status, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    if (resources) setMyResources(resources);

    const { data: events } = await supabase
      .from('events')
      .select('id, title, event_date, location, status')
      .eq('user_id', user.id)
      .order('event_date', { ascending: false });
    
    if (events) setMyEvents(events);

    const { data: registrations } = await supabase
      .from('event_registrations')
      .select('id, status, event:event_id(id, title, event_date, location, status)')
      .eq('user_id', user.id)
      .order('registered_at', { ascending: false });
    
    if (registrations) setMyRegistrations(registrations as Registration[]);
    
    setLoading(false);
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8"
      >
        <div className="flex items-start gap-6">
          <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white text-3xl font-bold">
            {profile?.username?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase()}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-slate-900">
                {profile?.username || '未设置昵称'}
              </h1>
              <button
                onClick={() => {
                  setEditForm({ username: profile?.username || '', bio: profile?.bio || '' });
                  setEditError('');
                  setShowEditModal(true);
                }}
                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <Edit className="w-4 h-4" />
              </button>
            </div>
            <p className="text-slate-500 mb-4">{profile?.bio || '暂无简介'}</p>
            <div className="flex items-center gap-6 text-sm text-slate-600">
              <span className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                {user.email}
              </span>
              <span className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                {profile?.location || '合肥'}
              </span>
            </div>
            <div className="mt-4">
              <button
                onClick={() => setShowPasswordModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors text-sm"
              >
                <Lock className="w-4 h-4" />
                修改密码
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 w-full max-w-md mx-4"
          >
            <h3 className="text-xl font-bold text-slate-900 mb-4">编辑资料</h3>
            {editError && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">{editError}</div>
            )}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">昵称</label>
                <input
                  type="text"
                  value={editForm.username}
                  onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="请输入昵称"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">简介</label>
                <textarea
                  value={editForm.bio}
                  onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                  rows={3}
                  placeholder="介绍一下自己"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50"
              >
                取消
              </button>
              <button
                onClick={async () => {
                  setEditError('');
                  if (!editForm.username.trim()) {
                    setEditError('昵称不能为空');
                    return;
                  }
                  const { error } = await supabase
                    .from('profiles')
                    .upsert({
                      id: user!.id,
                      username: editForm.username.trim(),
                      bio: editForm.bio.trim() || null,
                      updated_at: new Date().toISOString()
                    });
                  if (error) {
                    setEditError('保存失败：' + error.message);
                  } else {
                    setProfile(prev => prev ? { ...prev, username: editForm.username.trim(), bio: editForm.bio.trim() || null } : { id: user!.id, username: editForm.username.trim(), avatar_url: null, bio: editForm.bio.trim() || null, location: null });
                    setShowEditModal(false);
                  }
                }}
                className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                保存
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 w-full max-w-md mx-4"
          >
            <h3 className="text-xl font-bold text-slate-900 mb-4">修改密码</h3>
            {passwordError && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">{passwordError}</div>
            )}
            {passwordSuccess && (
              <div className="mb-4 p-3 bg-green-50 text-green-600 rounded-lg text-sm">{passwordSuccess}</div>
            )}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">当前密码</label>
                <input
                  type="password"
                  value={passwordForm.current}
                  onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">新密码</label>
                <input
                  type="password"
                  value={passwordForm.new}
                  onChange={(e) => setPasswordForm({ ...passwordForm, new: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">确认新密码</label>
                <input
                  type="password"
                  value={passwordForm.confirm}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setPasswordForm({ current: '', new: '', confirm: '' });
                  setPasswordError('');
                  setPasswordSuccess('');
                }}
                className="flex-1 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50"
              >
                取消
              </button>
              <button
                onClick={async () => {
                  setPasswordError('');
                  setPasswordSuccess('');
                  if (!passwordForm.current || !passwordForm.new || !passwordForm.confirm) {
                    setPasswordError('请填写所有字段');
                    return;
                  }
                  if (passwordForm.new !== passwordForm.confirm) {
                    setPasswordError('两次输入的新密码不一致');
                    return;
                  }
                  if (passwordForm.new.length < 6) {
                    setPasswordError('新密码至少需要6位');
                    return;
                  }
                  const { error } = await supabase.auth.updateUser({
                    password: passwordForm.new
                  });
                  if (error) {
                    setPasswordError('密码修改失败：' + error.message);
                  } else {
                    setPasswordSuccess('密码修改成功！');
                    setTimeout(() => {
                      setShowPasswordModal(false);
                      setPasswordForm({ current: '', new: '', confirm: '' });
                    }, 1500);
                  }
                }}
                className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                确认修改
              </button>
            </div>
          </motion.div>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl shadow-sm border border-slate-200 p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <Package className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-slate-900">我发布的资源</h2>
          </div>
          <div className="space-y-3">
            {myResources.length === 0 ? (
              <p className="text-slate-400 text-sm">暂无发布的资源</p>
            ) : (
              myResources.slice(0, 5).map((resource) => (
                <Link
                  key={resource.id}
                  to={`/resources/${resource.id}`}
                  className="block p-3 bg-slate-50 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-slate-800 text-sm">{resource.title}</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      resource.type === '提供' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                    }`}>
                      {resource.type}
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl shadow-sm border border-slate-200 p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <Calendar className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-semibold text-slate-900">我发布的活动</h2>
          </div>
          <div className="space-y-3">
            {myEvents.length === 0 ? (
              <p className="text-slate-400 text-sm">暂无发布的活动</p>
            ) : (
              myEvents.slice(0, 5).map((event) => (
                <Link
                  key={event.id}
                  to={`/events/${event.id}`}
                  className="block p-3 bg-slate-50 rounded-lg hover:bg-indigo-50 transition-colors"
                >
                  <div className="font-medium text-slate-800 text-sm">{event.title}</div>
                  <div className="text-xs text-slate-500 mt-1">
                    {new Date(event.event_date).toLocaleDateString('zh-CN')}
                  </div>
                </Link>
              ))
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl shadow-sm border border-slate-200 p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <h2 className="text-lg font-semibold text-slate-900">我报名的活动</h2>
          </div>
          <div className="space-y-3">
            {myRegistrations.length === 0 ? (
              <p className="text-slate-400 text-sm">暂无报名的活动</p>
            ) : (
              myRegistrations.slice(0, 5).map((reg) => (
                <Link
                  key={reg.id}
                  to={`/events/${reg.event.id}`}
                  className="block p-3 bg-slate-50 rounded-lg hover:bg-green-50 transition-colors"
                >
                  <div className="font-medium text-slate-800 text-sm">{reg.event.title}</div>
                  <div className="text-xs text-slate-500 mt-1">
                    {new Date(reg.event.event_date).toLocaleDateString('zh-CN')}
                  </div>
                </Link>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
