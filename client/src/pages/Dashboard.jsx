import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import useAppStore from '../store/useAppStore';
import { socket } from '../services/socket';
import api from '../services/api';
import RoomManagement from '../components/RoomManagement';
import ChatBox from '../components/ChatBox';
import LiveMap from '../components/LiveMap';
import Sidebar from '../components/Sidebar';
import SettingsModal from '../components/SettingsModal';
import { LogOut, Map, Settings, Users, MessageSquare } from 'lucide-react';

const Dashboard = () => {
    const { currentRoom, currentGroup, userInfo, updateOnlineUser, setOnlineUsers, logout, members, setMembers, locationSharing, setLocationSharing } = useAppStore();
    const [activeTab, setActiveTab] = useState('chat'); // 'chat' or 'map'
    const [showSidebar, setShowSidebar] = useState(true);
    const [showSettings, setShowSettings] = useState(false);
    const [locationWatcher, setLocationWatcher] = useState(null);

    // Fetch members when room is joined
    useEffect(() => {
        if (currentRoom) {
            const fetchMembers = async () => {
                try {
                    const { data } = await api.get(`/rooms/room-members/${currentRoom._id}`);
                    setMembers(data);
                } catch (error) {
                    console.error('Failed to fetch members:', error);
                }
            };
            fetchMembers();
        }
    }, [currentRoom, setMembers]);

    // Socket Connection and Global Listeners
    useEffect(() => {
        if (currentRoom && userInfo) {
            if (!socket.connected) {
                socket.connect();
            }

            socket.emit('join_room', {
                roomId: currentRoom._id,
                userId: userInfo._id,
                userName: userInfo.name
            });

            socket.on('receive_message', (data) => {
                useAppStore.getState().addMessage(data);
            });

            socket.on('share_location', (data) => {
                updateOnlineUser(data);
            });

            return () => {
                socket.off('receive_message');
                socket.off('share_location');
            };
        }
    }, [currentRoom, userInfo]);

    // Location sharing — only runs when the toggle is ON
    useEffect(() => {
        if (!currentRoom || !userInfo || !locationSharing) {
            return;
        }

        const watcherId = navigator.geolocation.watchPosition(
            (position) => {
                const locationData = {
                    roomId: currentRoom._id,
                    userId: userInfo._id,
                    userName: userInfo.name,
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                };
                updateOnlineUser(locationData);
                socket.emit('location_update', locationData);
            },
            (error) => {
                console.log('Geolocation error:', error);
                if (error.code === 1 || error.message.includes('Only secure origins are allowed')) {
                    toast.error("Location blocked: enable location permissions or use HTTPS.", { duration: 6000 });
                    setLocationSharing(false);
                }
            },
            { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );

        setLocationWatcher(watcherId);

        return () => {
            navigator.geolocation.clearWatch(watcherId);
            setLocationWatcher(null);
        };
    }, [currentRoom, userInfo, locationSharing]);

    // Prevent browser back button from going to login page
    useEffect(() => {
        const handlePopState = (e) => {
            // Push state back so we stay on dashboard
            window.history.pushState(null, '', '/dashboard');
        };

        window.history.pushState(null, '', '/dashboard');
        window.addEventListener('popstate', handlePopState);

        return () => {
            window.removeEventListener('popstate', handlePopState);
        };
    }, []);

    const handleLeaveTrip = () => {
        if (locationWatcher !== null) navigator.geolocation.clearWatch(locationWatcher);
        setLocationSharing(false);
        socket.disconnect();
        useAppStore.getState().setCurrentRoom(null);
        useAppStore.getState().setCurrentGroup(null);
    };

    if (!currentRoom) {
        return <RoomManagement onRoomJoined={(room) => {
            // Room joined logic handled by Zustand automatically re-rendering this
        }} />;
    }

    return (
        <div className="flex h-screen bg-white overflow-hidden font-sans relative">

            {/* Modals */}
            <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />

            {/* Main Content Layout */}
            <div className="flex-1 flex flex-col md:flex-row max-w-[1400px] mx-auto w-full shadow-2xl overflow-hidden md:rounded-3xl md:my-6 border border-gray-200 relative z-10">

                {/* Left Sidebar (Settings/Nav) */}
                <div className="w-20 bg-gray-900 flex flex-col items-center py-6 hidden md:flex shrink-0 z-50">
                    {userInfo?.avatar ? (
                        <img src={userInfo.avatar} alt="Profile" className="w-12 h-12 rounded-xl object-cover shadow-lg mb-8 border border-gray-700" title={userInfo?.name} />
                    ) : (
                        <div className="w-12 h-12 bg-gradient-to-tr from-brand-600 to-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg mb-8" title={userInfo?.name}>
                            {userInfo?.name?.charAt(0).toUpperCase() || 'AS'}
                        </div>
                    )}

                    <div className="space-y-6 flex-1 flex flex-col">
                        <button title="Members & Groups" onClick={() => setShowSidebar(!showSidebar)} className={`p-3 rounded-xl transition-all ${showSidebar ? 'bg-gray-800 text-white shadow-md' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}>
                            <Users size={24} />
                        </button>

                        <div className="w-8 h-px bg-gray-800 self-center my-2"></div>

                        <button title="Trip Chat" onClick={() => setActiveTab('chat')} className={`p-3 rounded-xl transition-all ${activeTab === 'chat' ? 'bg-brand-600 text-white shadow-md shadow-brand-500/30' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}>
                            <MessageSquare size={24} />
                        </button>
                        <button title="Live Radar" onClick={() => setActiveTab('map')} className={`p-3 rounded-xl transition-all ${activeTab === 'map' ? 'bg-brand-600 text-white shadow-md shadow-brand-500/30' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}>
                            <Map size={24} />
                        </button>

                        <div className="w-8 h-px bg-gray-800 self-center my-2"></div>

                        <button title="Settings" onClick={() => setShowSettings(true)} className="p-3 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800 transition-all">
                            <Settings size={24} />
                        </button>
                    </div>

                    <button title="Leave Trip" onClick={handleLeaveTrip} className="p-3 rounded-xl text-red-400 hover:text-white hover:bg-red-500 transition-all mt-auto group">
                        <LogOut size={24} className="group-hover:-translate-x-1 duration-200" />
                    </button>
                </div>

                {/* Subgroups & Members Sidebar Overlay */}
                {showSidebar && <Sidebar isOpen={showSidebar} onClose={() => setShowSidebar(false)} />}

                {/* Main Content Area - Full width remaining */}
                <div className="flex-1 flex flex-col relative w-full h-full bg-slate-50">

                    {/* Chat Tab */}
                    {activeTab === 'chat' && (
                        <div className="flex-1 flex flex-col h-full overflow-hidden">
                            <ChatBox onMobileMenuClick={() => setShowSidebar(true)} />
                        </div>
                    )}

                    {/* Map Tab */}
                    {activeTab === 'map' && (
                        <div className="flex-1 flex flex-col h-full bg-slate-50 p-4 md:p-6 transition-all duration-300">
                            {/* Mobile specific back button since the sidebar icons aren't visible */}
                            <button onClick={() => setActiveTab('chat')} className="md:hidden mb-4 text-brand-600 font-bold self-start bg-brand-50 px-4 py-2 rounded-lg border border-brand-100 flex items-center space-x-2">
                                <MessageSquare size={16} />
                                <span>Back to Chat</span>
                            </button>

                            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                                <span className="w-3 h-3 bg-red-500 rounded-full mr-2 animate-pulse shadow-sm shadow-red-500/50"></span>
                                Live Radar
                            </h2>
                            <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden relative">
                                <LiveMap isVisible={activeTab === 'map'} />

                                {/* Members overlay */}
                                <div className="absolute top-4 left-4 right-4 flex space-x-2 overflow-x-auto pb-2 pointer-events-none z-[1000]">
                                    {useAppStore.getState().members.map((member) => {
                                        const isOnline = Object.values(useAppStore.getState().onlineUsers || {}).some(
                                            u => u.userId === member._id
                                        );

                                        return (
                                            <div key={member._id} className="bg-white/90 backdrop-blur pointer-events-auto px-3 py-1.5 rounded-full shadow-sm border border-gray-100 flex items-center space-x-2 text-xs font-semibold text-gray-700 whitespace-nowrap">
                                                <span className={`w-2 h-2 shrink-0 rounded-full ${isOnline ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                                                <span>{member.name} {member._id === userInfo?._id ? '(You)' : ''}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Mobile Bottom Navigation */}
                <div className="md:hidden flex items-center justify-around bg-white border-t border-gray-200 p-2 pb-safe z-50 shrink-0">
                    <button onClick={() => setShowSidebar(!showSidebar)} className={`p-3 rounded-xl transition-all ${showSidebar ? 'text-brand-600' : 'text-gray-400 hover:text-brand-600'}`}>
                        <Users size={24} />
                    </button>

                    <button onClick={() => setActiveTab('chat')} className={`p-3 rounded-xl transition-all ${activeTab === 'chat' ? 'bg-brand-50 text-brand-600 shadow-sm' : 'text-gray-400 hover:text-brand-600'}`}>
                        <MessageSquare size={24} />
                    </button>

                    <button onClick={() => setActiveTab('map')} className={`p-3 rounded-xl transition-all ${activeTab === 'map' ? 'bg-brand-50 text-brand-600 shadow-sm' : 'text-gray-400 hover:text-brand-600'}`}>
                        <Map size={24} />
                    </button>

                    <button onClick={() => setShowSettings(true)} className="p-3 rounded-xl text-gray-400 hover:text-brand-600 transition-all">
                        <Settings size={24} />
                    </button>

                    <button onClick={handleLeaveTrip} className="p-3 rounded-xl text-red-400 hover:text-red-500 transition-all">
                        <LogOut size={24} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
