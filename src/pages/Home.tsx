import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Package, Calendar, Users, ArrowRight, MapPin, Clock, Building2, Phone, MessageCircle } from 'lucide-react';
import { supabase } from '../supabase/client';
import { Tables } from '../supabase/types';
import { useWechatShare } from '../hooks/useWechatShare';

type Resource = Tables<'resources'>;
type Event = Tables<'events'>;

export default function Home() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [communities, setCommunities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useWechatShare({
    title: 'OPC合肥 - OPC资源交换与活动平台',
    desc: 'OPC们交换资源，发布合肥本地活动通知的互助社区',
    imgUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=300&h=300&fit=crop'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const [{ data: resourcesData }, { data: eventsData }, { data: communitiesData }] = await Promise.all([
      supabase.from('resources').select('*').eq('status', 'active').order('created_at', { ascending: false }).limit(4),
      supabase.from('events').select('*').eq('status', 'upcoming').order('event_date', { ascending: true }).limit(3),
      supabase.from('communities').select('*').eq('status', 'active').order('created_at', { ascending: false }).limit(4)
    ]);
    setResources(resourcesData || []);
    setEvents(eventsData || []);
    setCommunities(communitiesData || []);
    setLoading(false);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-16">
      {/* Hero Section */}
      <motion.section variants={itemVariants} className="text-center py-12">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl mx-auto mb-6 flex items-center justify-center"
        >
          <Users className="w-10 h-10 text-white" />
        </motion.div>
        <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
          OPC合肥资源交换平台
        </h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto mb-8">
          连接合肥本地OPC，交换资源、分享活动，共建互助社区
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link
            to="/resources"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
          >
            <Package className="w-5 h-5" />
            浏览资源
          </Link>
          <Link
            to="/events"
            className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors"
          >
            <Calendar className="w-5 h-5" />
            查看活动
          </Link>
        </div>
      </motion.section>

      {/* Features */}
      <motion.section variants={itemVariants} className="grid md:grid-cols-3 gap-6">
        {[
          { icon: Package, title: '资源交换', desc: '发布和寻找各类资源需求' },
          { icon: Calendar, title: '活动通知', desc: '获取合肥本地OPC活动信息' },
          { icon: Users, title: '社区互助', desc: '连接志同道合的OPC伙伴' }
        ].map((feature, index) => (
          <motion.div
            key={index}
            whileHover={{ y: -4 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100"
          >
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-4">
              <feature.icon className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">{feature.title}</h3>
            <p className="text-slate-500">{feature.desc}</p>
          </motion.div>
        ))}
      </motion.section>

      {/* OPC社区地图 */}
      <motion.section variants={itemVariants}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-900">OPC社区地图</h2>
          <Link to="/communities" className="flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium">
            查看全部 <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl p-4 border border-slate-100 animate-pulse">
                <div className="h-4 bg-slate-200 rounded mb-2" />
                <div className="h-3 bg-slate-100 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : communities.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {communities.map((community) => (
              <motion.div
                key={community.id}
                whileHover={{ y: -4, scale: 1.02 }}
                className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all cursor-pointer"
                onClick={() => window.location.hash = `/communities/${community.id}`}
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-lg flex items-center justify-center">
                    <Building2 className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-xs text-slate-400">社区</span>
                </div>
                <h3 className="font-semibold text-slate-900 mb-2 line-clamp-1">{community.name}</h3>
                <p className="text-sm text-slate-500 line-clamp-2 mb-3 flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {community.address}
                </p>
                <span className="text-sm text-blue-600 font-medium">查看详情 →</span>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-xl border border-slate-100">
            <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">暂无社区信息</p>
          </div>
        )}
      </motion.section>

      {/* Contact Info */}
      <motion.section variants={itemVariants} className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8 text-center">
        <h3 className="text-lg font-semibold text-slate-900 mb-2">社区入驻</h3>
        <p className="text-slate-600">请联系管理员微信：<span className="font-medium text-blue-600">opchefei</span></p>
      </motion.section>

      {/* Latest Resources */}
      <motion.section variants={itemVariants}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-900">最新资源</h2>
          <Link to="/resources" className="flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium">
            查看全部 <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl p-4 border border-slate-100 animate-pulse">
                <div className="h-4 bg-slate-200 rounded mb-2" />
                <div className="h-3 bg-slate-100 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : resources.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {resources.map((resource) => (
              <motion.div
                key={resource.id}
                whileHover={{ y: -4, scale: 1.02 }}
                className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all"
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    resource.type === '提供' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                  }`}>
                    {resource.type}
                  </span>
                  <span className="text-xs text-slate-400">{resource.category}</span>
                </div>
                <h3 className="font-semibold text-slate-900 mb-2 line-clamp-1">{resource.title}</h3>
                <p className="text-sm text-slate-500 line-clamp-2 mb-3">{resource.description}</p>
                <Link to={`/resources/${resource.id}`} className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                  查看详情 →
                </Link>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-xl border border-slate-100">
            <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">暂无资源，快来发布第一个资源吧！</p>
          </div>
        )}
      </motion.section>

      {/* Upcoming Events */}
      <motion.section variants={itemVariants}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-900">即将开始的活动</h2>
          <Link to="/events" className="flex items-center gap-1 text-indigo-600 hover:text-indigo-700 font-medium">
            查看全部 <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        {loading ? (
          <div className="grid md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl p-4 border border-slate-100 animate-pulse">
                <div className="h-4 bg-slate-200 rounded mb-2" />
                <div className="h-3 bg-slate-100 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : events.length > 0 ? (
          <div className="grid md:grid-cols-3 gap-4">
            {events.map((event) => (
              <motion.div
                key={event.id}
                whileHover={{ y: -4, scale: 1.02 }}
                className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all"
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-2 py-1 text-xs font-medium bg-indigo-100 text-indigo-700 rounded-full">
                    {event.category}
                  </span>
                </div>
                <h3 className="font-semibold text-slate-900 mb-2 line-clamp-1">{event.title}</h3>
                <div className="flex items-center gap-4 text-sm text-slate-500 mb-3">
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {new Date(event.event_date).toLocaleDateString('zh-CN')}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {event.location}
                  </span>
                </div>
                <Link to={`/events/${event.id}`} className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                  了解详情 →
                </Link>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-xl border border-slate-100">
            <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">暂无活动，敬请期待！</p>
          </div>
        )}
      </motion.section>
    </motion.div>
  );
}
