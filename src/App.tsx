import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/Layout';
import Home from './pages/Home';
import Resources from './pages/Resources';
import ResourceDetail from './pages/ResourceDetail';
import Events from './pages/Events';
import EventDetail from './pages/EventDetail';
import Profile from './pages/Profile';
import Login from './pages/Login';
import Register from './pages/Register';
import CreateResource from './pages/CreateResource';
import CreateEvent from './pages/CreateEvent';
import EditResource from './pages/EditResource';
import EditEvent from './pages/EditEvent';
import Communities from './pages/Communities';
import CommunityDetail from './pages/CommunityDetail';
import CreateCommunity from './pages/CreateCommunity';
import EditCommunity from './pages/EditCommunity';
import AdminUsers from './pages/AdminUsers';

function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="resources" element={<Resources />} />
            <Route path="resources/:id" element={<ResourceDetail />} />
            <Route path="resources/create" element={<CreateResource />} />
            <Route path="resources/edit/:id" element={<EditResource />} />
            <Route path="events" element={<Events />} />
            <Route path="events/:id" element={<EventDetail />} />
            <Route path="events/create" element={<CreateEvent />} />
            <Route path="events/edit/:id" element={<EditEvent />} />
            <Route path="communities" element={<Communities />} />
            <Route path="communities/:id" element={<CommunityDetail />} />
            <Route path="communities/create" element={<CreateCommunity />} />
            <Route path="communities/edit/:id" element={<EditCommunity />} />
            <Route path="profile" element={<Profile />} />
            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />
            <Route path="admin/users" element={<AdminUsers />} />
          </Route>
        </Routes>
      </HashRouter>
    </AuthProvider>
  );
}

export default App;
