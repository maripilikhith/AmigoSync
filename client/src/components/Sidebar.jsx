import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Hash, Copy, Plus, LogOut, Trash2, Phone } from 'lucide-react';
import useAppStore from '../store/useAppStore';
import api from '../services/api';
import toast from 'react-hot-toast';
import ProfilePhotoModal from './ProfilePhotoModal';

const Sidebar = ({ isOpen, onClose }) => {
    const { currentRoom, currentGroup, setCurrentGroup, userInfo, members } = useAppStore();
    const [groups, setGroups] = useState([]);
    const [newGroupName, setNewGroupName] = useState('');
    const [isCreatingGroup, setIsCreatingGroup] = useState(false);
    const [selectedMembers, setSelectedMembers] = useState([]);
    const [photoMember, setPhotoMember] = useState(null);

    useEffect(() => {
        if (currentRoom) {
            fetchGroups();
        }
    }, [currentRoom]);

    const fetchGroups = async () => {
        try {
            const { data } = await api.get(`/groups/room-groups/${currentRoom._id}`);
            setGroups(data);
        } catch (error) {
            console.error('Failed to fetch groups:', error);
        }
    };

    const handleCreateGroup = async (e) => {
        e.preventDefault();
        if (!newGroupName.trim()) return;
        try {
            const { data } = await api.post('/groups/create-group', {
                groupName: newGroupName,
                roomId: currentRoom._id,
                initialMembers: selectedMembers
            });
            setGroups([...groups, data]);
            setNewGroupName('');
            setSelectedMembers([]);
            setIsCreatingGroup(false);
            toast.success('Subgroup created!');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to create subgroup');
        }
    };

    const handleJoinGroup = async (groupId) => {
        try {
            const { data } = await api.post('/groups/join-group', { groupId });
            toast.success('Joined subgroup!');
            fetchGroups(); // Refresh to show updated member count
            setCurrentGroup(data);
        } catch (error) {
            if (error.response?.status === 400) {
                // Already a member, just switch context
                const group = groups.find(g => g._id === groupId);
                setCurrentGroup(group);
                toast.success(`Switched to ${group.groupName}`);
            } else {
                toast.error(error.response?.data?.message || 'Failed to join subgroup');
            }
        }
    };

    const handleDeleteGroup = async (groupId, e) => {
        e.stopPropagation(); // prevent joinGroup from firing
        if (!window.confirm("Are you sure you want to delete this subgroup? All messages will be lost.")) return;

        try {
            await api.delete(`/groups/${groupId}`);
            setGroups(groups.filter(g => g._id !== groupId));
            if (currentGroup?._id === groupId) {
                setCurrentGroup(null);
            }
            toast.success('Subgroup deleted');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to delete subgroup');
        }
    };

    const copyCode = () => {
        navigator.clipboard.writeText(currentRoom?.roomCode || '');
        toast.success('Room code copied to clipboard!');
    };

    const toggleMemberSelection = (memberId) => {
        if (selectedMembers.includes(memberId)) {
            setSelectedMembers(selectedMembers.filter(id => id !== memberId));
        } else {
            setSelectedMembers([...selectedMembers, memberId]);
        }
    };

    const handleOpenDM = async (memberId) => {
        if (memberId === userInfo?._id) return;
        try {
            const { data } = await api.post('/groups/dm', {
                roomId: currentRoom._id,
                targetUserId: memberId
            });
            const otherMember = data.members.find(m => m._id === memberId || m === memberId);
            const otherName = typeof otherMember === 'object' ? otherMember.name : members.find(m => m._id === memberId)?.name;
            const groupForState = { ...data, groupName: `Chat with ${otherName}` };
            setCurrentGroup(groupForState);
            if (window.innerWidth < 768) {
                onClose();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to open direct message');
        }
    };

    return (
        <>
        <div className={`fixed inset-y-0 left-0 w-80 bg-white shadow-2xl z-40 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'} flex flex-col border-r border-gray-100`}>

            {/* Header / Room Info */}
            <div className="p-6 bg-brand-50 border-b border-brand-100">
                <div className="flex justify-between items-start mb-4">
                    <h2 className="text-xl font-bold text-gray-800 break-words pr-2">{currentRoom?.roomName}</h2>
                    <button className="md:hidden text-gray-500 hover:text-gray-800" onClick={onClose}>✕</button>
                </div>
                <div className="bg-white rounded-xl p-3 shadow-sm border border-brand-100 flex justify-between items-center">
                    <div>
                        <p className="text-xs text-brand-600 font-semibold uppercase tracking-wider mb-1">Invite Code</p>
                        <p className="font-mono text-lg font-bold text-gray-800 tracking-widest">{currentRoom?.roomCode}</p>
                    </div>
                    <button onClick={copyCode} className="p-2 text-brand-500 hover:bg-brand-50 rounded-lg transition-colors" title="Copy Code">
                        <Copy size={18} />
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-8">
                {/* Members Section */}
                <section>
                    <div className="flex items-center text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 px-2">
                        <Users size={16} className="mr-2" />
                        Trip Members ({members.length})
                    </div>
                    <div className="space-y-2">
                        {members.map(member => (
                            <div key={member._id} onClick={() => handleOpenDM(member._id)} className={`flex items-center space-x-3 p-2 rounded-xl hover:bg-gray-50 transition-colors ${member._id !== userInfo?._id ? 'cursor-pointer' : ''}`}>
                                {member.avatar ? (
                                    <img
                                        src={member.avatar}
                                        alt={member.name}
                                        className="w-10 h-10 rounded-full object-cover border border-indigo-200 shrink-0 cursor-pointer hover:ring-2 hover:ring-brand-400 transition-all"
                                        onClick={(e) => { e.stopPropagation(); setPhotoMember(member); }}
                                    />
                                ) : (
                                    <div
                                        className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold border border-indigo-200 shrink-0 cursor-pointer hover:ring-2 hover:ring-brand-400 transition-all"
                                        onClick={(e) => { e.stopPropagation(); setPhotoMember(member); }}
                                    >
                                        {member.name.charAt(0).toUpperCase()}
                                    </div>
                                )}
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">{member.name}</p>
                                    <p className="text-xs text-gray-500 truncate">{member.email}</p>
                                    {member.phone && (
                                        <p className="text-[11px] text-gray-400 truncate mt-0.5 font-medium">{member.phone}</p>
                                    )}
                                </div>
                                <div className="flex items-center space-x-2 shrink-0">
                                    {member.phone && member._id !== userInfo?._id && (
                                        <a href={`tel:${member.phone}`} className="p-1.5 text-brand-600 hover:bg-brand-50 rounded-lg transition-colors" title="Call Member">
                                            <Phone size={14} />
                                        </a>
                                    )}
                                    {member._id === userInfo?._id && (
                                        <span className="text-[10px] bg-brand-100 text-brand-700 px-2 py-1 rounded-full font-bold">YOU</span>
                                    )}
                                    {member._id === currentRoom?.createdBy && (
                                        <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-bold shadow-sm border border-blue-200" title="Trip Creator">ADMIN</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Subgroups Section */}
                <section>
                    <div className="flex items-center justify-between px-2 mb-4">
                        <div className="flex items-center text-sm font-semibold text-gray-500 uppercase tracking-wider">
                            <Hash size={16} className="mr-2" />
                            Subgroups
                        </div>
                        <button
                            onClick={() => {
                                setIsCreatingGroup(!isCreatingGroup);
                                setSelectedMembers([]);
                                setNewGroupName('');
                            }}
                            className={`p-1 rounded-lg transition-colors ${isCreatingGroup ? 'bg-red-50 text-red-600' : 'bg-brand-50 text-brand-600 hover:bg-brand-100'}`}
                        >
                            <Plus size={18} className={isCreatingGroup ? "rotate-45" : ""} />
                        </button>
                    </div>

                    {isCreatingGroup && (
                        <form onSubmit={handleCreateGroup} className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-3">
                            <p className="text-xs font-semibold text-gray-500 uppercase">Create New</p>
                            <input
                                autoFocus
                                type="text"
                                value={newGroupName}
                                onChange={(e) => setNewGroupName(e.target.value)}
                                placeholder="Group Name e.g. 'Foodies'"
                                className="w-full text-sm px-3 py-2.5 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                            />

                            <div className="pt-2">
                                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Who to add?</p>
                                <div className="max-h-32 overflow-y-auto space-y-1 mb-3">
                                    {members
                                        .filter(m => m._id !== userInfo?._id)
                                        .map(member => (
                                            <label key={member._id} className="flex items-center space-x-2 p-1.5 hover:bg-white rounded-md cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    className="rounded text-brand-600 focus:ring-brand-500 bg-gray-100 border-gray-300 pointer-events-none"
                                                    checked={selectedMembers.includes(member._id)}
                                                    onChange={() => toggleMemberSelection(member._id)}
                                                />
                                                <span className="text-sm text-gray-700 truncate">{member.name}</span>
                                            </label>
                                        ))}
                                    {members.filter(m => m._id !== userInfo?._id).length === 0 && (
                                        <p className="text-xs text-gray-400 italic">No remaining unassigned members.</p>
                                    )}
                                </div>
                            </div>

                            <button type="submit" disabled={!newGroupName.trim()} className="w-full bg-brand-600 text-white text-sm font-semibold py-2.5 rounded-lg hover:bg-brand-700 disabled:opacity-50 transition-colors">
                                Create Subgroup
                            </button>
                        </form>
                    )}

                    <div className="space-y-2">
                        <div
                            onClick={() => setCurrentGroup(null)}
                            className={`p-3 rounded-xl cursor-pointer transition-colors border ${!currentGroup ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-gray-100 text-gray-700 hover:bg-gray-50'}`}
                        >
                            <p className="font-semibold text-sm">Main Trip Chat</p>
                            <p className="text-xs opacity-70 mt-0.5">Everyone in the trip</p>
                        </div>

                        {groups.filter(g => !g.isDM).map(group => {
                            const isMember = group.members.some(m => m._id === userInfo?._id || m === userInfo?._id);
                            return (
                                <div
                                    key={group._id}
                                    onClick={() => handleJoinGroup(group._id)}
                                    className={`p-3 rounded-xl cursor-pointer transition-colors border flex justify-between items-center ${currentGroup?._id === group._id ? 'bg-brand-50 border-brand-200 text-brand-700' : 'bg-white border-gray-100 text-gray-700 hover:bg-gray-50'}`}
                                >
                                    <div>
                                        <p className="font-semibold text-sm"># {group.groupName}</p>
                                        <p className="text-xs opacity-70 mt-0.5">{group.members.length} member(s)</p>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        {!isMember && (
                                            <button className="text-xs font-bold text-gray-400 hover:text-brand-600 px-2 py-1 bg-gray-50 rounded-lg hover:bg-brand-50">
                                                Join
                                            </button>
                                        )}
                                        {(group.createdBy === userInfo?._id || currentRoom?.createdBy === userInfo?._id) && (
                                            <button
                                                onClick={(e) => handleDeleteGroup(group._id, e)}
                                                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Delete Subgroup"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>
            </div>
        </div>

        <ProfilePhotoModal
            isOpen={!!photoMember}
            onClose={() => setPhotoMember(null)}
            name={photoMember?.name}
            avatarUrl={photoMember?.avatar}
        />
        </>
    );
};

export default Sidebar;
