import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../supabase/client';
import { useAuth } from '../contexts/AuthContext';
import {
  Calendar,
  MapPin,
  Users,
  Clock,
  ArrowLeft,
  UserPlus,
  CheckCircle,
  XCircle,
  Edit,
  Trash2
} from 'lucide-react';
import { useWechatShare } from '../hooks/useWechatShare';

interface Event {
  id: string;
  title: string;
  description: string;
  location: string;
  event_date: string;
  end_date: string | null;
  category: string;
  max_participants: number | null;
  current_participants: number;
  images: string[] | null;
  status: string;
  created_at: string;
  user_id: string;
}

interface Profile {
  id: string;
  username: string | null;
  avatar_url: string | null;
}

export default function EventDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [creator, setCreator] = useState<Profile | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);

  useWechatShare(event ? {
    title: `${event.title} - OPC合肥活动`,
    desc: `${event.location} | ${new Date(event.event_date).toLocaleDateString('zh-CN')}`
  } : undefined);

  useEffect(() => {
    fetchEvent();
  }, [id]);

  useEffect(() => {
    if (user && event) {
      checkRegistration();
    }
  }, [user, event]);

  const fetchEvent = async () => {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching event:', error);
      return;
    }

    setEvent(data);
    
    if (data.user_id) {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user_id)
        .single();
      setCreator(profileData);
    }
    
    setLoading(false);
  };

  const checkRegistration = async () => {
    if (!user || !event) return;
    
    const { data } = await supabase
      .from('event_registrations')
      .select('*')
      .eq('event_id', event.id)
      .eq('user_id', user.id)
      .maybeSingle();
    
    setIsRegistered(!!data);
  };

  const handleRegister = async () => {
    if (!user || !event) {
      navigate('/login');
      return;
    }

    setRegistering(true);
    
    const { error } = await supabase
      .from('event_registrations')
      .insert({
        event_id: event.id,
        user_id: user.id
      });

    if (error) {
      console.error('Error registering:', error);
    } else {
      setIsRegistered(true);
      setEvent({ ...event, current_participants: event.current_participants + 1 });
    }
    
    setRegistering(false);
  };

  const handleCancel = async () => {
    if (!user || !event) return;

    setRegistering(true);
    
    const { error } = await supabase
      .from('event_registrations')
      .delete()
      .eq('event_id', event.id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error cancelling:', error);
    } else {
      setIsRegistered(false);
      setEvent({ ...event, current_participants: Math.max(0, event.current_participants - 1) });
    }
    
    setRegistering(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="text-center py-16">
        <p className="text-slate-500">活动不存在</p>
      </div>
    );
  }

  const isFull = event.max_participants && event.current_participants >= event.max_participants;
  const canRegister = !isFull && event.status === 'upcoming';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto"
    >
      <button
        onClick={() => navigate('/events')}
        className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6"
      >
        <ArrowLeft className="w-5 h-5" />
        返回活动列表
      </button>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {event.images && event.images.length > 0 && (
          <div className="h-64 bg-slate-100">
            <img 
              src={event.images[0]} 
              alt={event.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="p-8">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <span className="inline-block px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium mb-3">
                {event.category}
              </span>
              <h1 className="text-3xl font-bold text-slate-900">{event.title}</h1>
            </div>
            <span className={`px-4 py-2 rounded-full text-sm font-medium ${
              event.status === 'upcoming' ? 'bg-green-100 text-green-700' :
              event.status === 'ongoing' ? 'bg-blue-100 text-blue-700' :
              event.status === 'completed' ? 'bg-slate-100 text-slate-600' :
              'bg-red-100 text-red-700'
            }`}>
              {event.status === 'upcoming' ? '即将开始' :
               event.status === 'ongoing' ? '进行中' :
               event.status === 'completed' ? '已结束' : '已取消'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
              <Calendar className="w-5 h-5 text-slate-400" />
              <div>
                <p className="text-sm text-slate-500">活动时间</p>
                <p className="font-medium text-slate-900">{formatDate(event.event_date)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
              <MapPin className="w-5 h-5 text-slate-400" />
              <div>
                <p className="text-sm text-slate-500">活动地点</p>
                <p className="font-medium text-slate-900">{event.location}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
              <Users className="w-5 h-5 text-slate-400" />
              <div>
                <p className="text-sm text-slate-500">报名人数</p>
                <p className="font-medium text-slate-900">
                  {event.current_participants}
                  {event.max_participants && ` / ${event.max_participants}`} 人
                </p>
              </div>
            </div>
          </div>

          <div className="prose prose-slate max-w-none mb-8">
            <h3 className="text-lg font-semibold text-slate-900 mb-3">活动详情</h3>
            <p className="text-slate-600 whitespace-pre-wrap">{event.description}</p>
          </div>

          {creator && (
            <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl mb-8">
              <img 
                src={creator.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${creator.id}`}
                alt={creator.username || '用户'}
                className="w-12 h-12 rounded-full"
              />
              <div>
                <p className="text-sm text-slate-500">活动发起人</p>
                <p className="font-medium text-slate-900">{creator.username || '匿名用户'}</p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-4">
            {user?.id === event.user_id ? (
              <>
                <button
                  onClick={() => navigate(`/events/edit/${event.id}`)}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-50 text-blue-600 rounded-xl font-medium hover:bg-blue-100 transition-colors"
                >
                  <Edit className="w-5 h-5" />
                  编辑活动
                </button>
                <button
                  onClick={async () => {
                    if (confirm('确定要删除这个活动吗？')) {
                      const { error } = await supabase.from('events').delete().eq('id', event.id);
                      if (!error) navigate('/events');
                    }
                  }}
                  className="flex items-center gap-2 px-6 py-3 bg-red-50 text-red-600 rounded-xl font-medium hover:bg-red-100 transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                  删除活动
                </button>
              </>
            ) : (
              <>
                {isRegistered ? (
                  <button
                    onClick={handleCancel}
                    disabled={registering}
                    className="flex items-center gap-2 px-6 py-3 bg-red-50 text-red-600 rounded-xl font-medium hover:bg-red-100 transition-colors"
                  >
                    <XCircle className="w-5 h-5" />
                    {registering ? '取消中...' : '取消报名'}
                  </button>
                ) : (
                  <button
                    onClick={handleRegister}
                    disabled={!canRegister || registering}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-colors ${
                      canRegister
                        ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    <UserPlus className="w-5 h-5" />
                    {registering ? '报名中...' :
                     isFull ? '名额已满' :
                     event.status !== 'upcoming' ? '报名已结束' : '立即报名'}
                  </button>
                )}

                {isRegistered && (
                  <span className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="w-5 h-5" />
                    已报名
                  </span>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
