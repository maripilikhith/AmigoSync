import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../services/api';
import useAppStore from '../store/useAppStore';
import { Users, Plus, Hash, Clock, Settings, Trash2 } from 'lucide-react';
import SettingsModal from './SettingsModal';
import ProfilePhotoModal from './ProfilePhotoModal';

const RoomManagement = ({ onRoomJoined }) => {
    const [roomCode, setRoomCode] = useState('');
    const [roomName, setRoomName] = useState('');
    const [loading, setLoading] = useState(false);
    const [myRooms, setMyRooms] = useState([]);
    const { setCurrentRoom, userInfo, logout } = useAppStore();
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [showPhoto, setShowPhoto] = useState(false);

    useEffect(() => {
        const fetchMyRooms = async () => {
            try {
                const { data } = await api.get('/rooms/my-rooms');
                setMyRooms(data);
            } catch (error) {
                console.error('Failed to fetch rooms', error);
            }
        };
        fetchMyRooms();
    }, []);

    const handleCreateRoom = async (e) => {
        e.preventDefault();
        if (!roomName.trim()) return toast.error('Room name is required');
        setLoading(true);
        try {
            const { data } = await api.post('/rooms/create-room', { roomName });
            setCurrentRoom(data);
            toast.success(`Room created! Code: ${data.roomCode}`);
            onRoomJoined(data);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to create room');
        } finally {
            setLoading(false);
        }
    };

    const handleJoinRoom = async (e) => {
        e.preventDefault();
        if (!roomCode.trim()) return toast.error('Room code is required');
        setLoading(true);
        try {
            const { data } = await api.post('/rooms/join-room', { roomCode: roomCode.toUpperCase() });
            setCurrentRoom(data);
            toast.success('Successfully joined room');
            onRoomJoined(data);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to join room');
        } finally {
            setLoading(false);
        }
    };

    const handleEnterExistingRoom = (room) => {
        setCurrentRoom(room);
        onRoomJoined(room);
    };

    const handleDeleteRoom = async (roomId, e) => {
        e.stopPropagation();
        if (window.confirm('Are you certain you want to delete this trip permanently? All messages and subgroups will be lost.')) {
            try {
                await api.delete(`/rooms/delete-room/${roomId}`);
                setMyRooms(myRooms.filter(r => r._id !== roomId));
                if (useAppStore.getState().currentRoom?._id === roomId) {
                    setCurrentRoom(null);
                }
                toast.success('Trip deleted successfully');
            } catch (error) {
                toast.error(error.response?.data?.message || 'Failed to delete trip');
            }
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6 flex flex-col items-center justify-center">
            <div className="w-full max-w-4xl grid md:grid-cols-2 gap-8">

                {/* Profile Card */}
                <div className="md:col-span-2 bg-white rounded-2xl shadow-sm p-4 md:p-6 flex items-center border border-gray-100 mb-4 gap-4">
                    <div className="flex items-center space-x-4 min-w-0 w-full">
                        {userInfo?.avatar ? (
                            <img
                                src={userInfo.avatar}
                                alt={userInfo.name}
                                className="w-12 h-12 shrink-0 rounded-full object-cover border border-brand-200 cursor-pointer hover:ring-2 hover:ring-brand-400 transition-all"
                                onClick={() => setShowPhoto(true)}
                            />
                        ) : (
                            <div
                                className="w-12 h-12 shrink-0 bg-brand-100 rounded-full flex items-center justify-center text-brand-600 font-bold text-xl cursor-pointer hover:ring-2 hover:ring-brand-400 transition-all"
                                onClick={() => setShowPhoto(true)}
                            >
                                {userInfo?.name?.charAt(0).toUpperCase()}
                            </div>
                        )}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-bold text-gray-800 truncate pr-2" title={userInfo?.name}>{userInfo?.name}</h2>
                                <button onClick={() => setIsSettingsOpen(true)} className="text-gray-400 hover:text-brand-600 p-2 hover:bg-brand-50 rounded-lg transition-colors shrink-0" title="Account Settings">
                                    <Settings size={20} />
                                </button>
                            </div>
                            <p className="text-sm text-gray-500 truncate mt-0.5" title={myRooms.length > 0 ? 'Select a trip below or create a new one.' : 'You are not in any active trips.'}>
                                {myRooms.length > 0 ? 'Select a trip or create a new one.' : 'You are not in any active trips.'}
                            </p>
                        </div>
                    </div>
                </div>

                <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />

                {/* Create Room */}
                <div className="bg-white rounded-2xl shadow-sm p-8 border border-gray-100 hover:shadow-md transition-shadow">
                    <div className="w-12 h-12 bg-brand-50 text-brand-600 rounded-xl flex items-center justify-center mb-6">
                        <Plus size={24} />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800 mb-2">Create a New Trip</h3>
                    <p className="text-gray-500 mb-6 text-sm">Start a new adventure and generate a code for your friends to join.</p>

                    <form onSubmit={handleCreateRoom} className="space-y-4">
                        <div>
                            <input
                                type="text"
                                value={roomName}
                                onChange={(e) => setRoomName(e.target.value)}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                                placeholder="E.g. Goa Trip 2024"
                            />
                        </div>
                        <button
                            disabled={loading}
                            className="w-full py-3 bg-brand-600 text-white rounded-xl font-semibold hover:bg-brand-700 transition-colors shadow-sm disabled:opacity-50"
                        >
                            Create Trip
                        </button>
                    </form>
                </div>

                {/* Join Room */}
                <div className="bg-white rounded-2xl shadow-sm p-8 border border-gray-100 hover:shadow-md transition-shadow">
                    <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-6">
                        <Hash size={24} />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800 mb-2">Join an Existing Trip</h3>
                    <p className="text-gray-500 mb-6 text-sm">Have a code from a friend? Enter it below to join their room.</p>

                    <form onSubmit={handleJoinRoom} className="space-y-4">
                        <div>
                            <input
                                type="text"
                                value={roomCode}
                                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-mono uppercase tracking-widest text-center"
                                placeholder="CODE"
                                maxLength={6}
                            />
                        </div>
                        <button
                            disabled={loading}
                            className="w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50"
                        >
                            Join Trip
                        </button>
                    </form>
                </div>

                {/* Your Active Trips */}
                {myRooms.length > 0 && (
                    <div className="md:col-span-2 mt-4">
                        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                            <Clock size={20} className="mr-2 text-brand-600" /> Your Active Trips
                        </h3>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {myRooms.map(room => (
                                <div
                                    key={room._id}
                                    onClick={() => handleEnterExistingRoom(room)}
                                    className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md hover:border-brand-300 transition-all cursor-pointer group"
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex-1 min-w-0 pr-2">
                                            <h4 className="font-bold text-gray-800 group-hover:text-brand-600 transition-colors truncate">
                                                {room.roomName}
                                            </h4>
                                            <span className="inline-block mt-1 text-xs font-mono bg-gray-100 text-gray-600 px-2 py-1 rounded-md">
                                                {room.roomCode}
                                            </span>
                                        </div>
                                        {room.createdBy === userInfo?._id && (
                                            <button
                                                onClick={(e) => handleDeleteRoom(room._id, e)}
                                                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                                                title="Delete Trip"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </div>
                                    <div className="flex items-center text-sm text-gray-500">
                                        <Users size={14} className="mr-1.5" />
                                        <span>{room.members?.length || 1} Members</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

            </div>
            <ProfilePhotoModal
                isOpen={showPhoto}
                onClose={() => setShowPhoto(false)}
                name={userInfo?.name}
                avatarUrl={userInfo?.avatar}
            />
        </div>
    );
};

export default RoomManagement;
