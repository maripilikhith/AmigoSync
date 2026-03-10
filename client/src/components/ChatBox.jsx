import React, { useState, useEffect, useRef } from 'react';
import { Send, Hash, Menu } from 'lucide-react';
import useAppStore from '../store/useAppStore';
import { socket } from '../services/socket';
import api from '../services/api';

const ChatBox = ({ onMobileMenuClick }) => {
    const {
        currentRoom,
        currentGroup,
        userInfo,
        messages,
        setMessages,
        addMessage
    } = useAppStore();

    const [inputMessage, setInputMessage] = useState('');
    const messagesEndRef = useRef(null);

    // Fetch initial messages based on Group or Room
    useEffect(() => {
        const fetchMessages = async () => {
            try {
                const endpoint = currentGroup
                    ? `/messages?groupId=${currentGroup._id}`
                    : `/messages?roomId=${currentRoom._id}`;
                const { data } = await api.get(endpoint);
                setMessages(data);
            } catch (error) {
                console.error("Failed to fetch messages:", error);
            }
        };
        if (currentRoom) fetchMessages();
    }, [currentRoom, currentGroup, setMessages]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const sendMessage = (e) => {
        e.preventDefault();
        if (inputMessage.trim() && currentRoom) {
            const msgData = {
                roomId: currentRoom._id,
                message: inputMessage,
                sender: userInfo._id,
                senderName: userInfo.name
            };

            // If we are in a subgroup, attach the groupId
            if (currentGroup) {
                msgData.groupId = currentGroup._id;
            }

            // Emit to server, the server will broadcast it back to us with the final DB timestamp
            socket.emit('send_message', msgData);
            setInputMessage('');
        }
    };

    return (
        <div className="flex flex-col h-full bg-slate-50 relative">
            <header className="bg-white px-4 sm:px-6 py-4 flex justify-between items-center shadow-sm z-10">
                <div className="flex items-center space-x-3">
                    <button onClick={onMobileMenuClick} className="md:hidden p-2 -ml-2 text-gray-500 hover:bg-gray-100 rounded-lg">
                        <Menu size={24} />
                    </button>
                    {(() => {
                        if (currentGroup?.isDM) {
                            // Find the other user in the group
                            const otherUserId = currentGroup.members.find(m =>
                                (typeof m === 'object' ? m._id : m) !== userInfo?._id
                            );
                            const actualId = typeof otherUserId === 'object' ? otherUserId._id : otherUserId;
                            // eslint-disable-next-line
                            const otherMember = useAppStore.getState().members.find(m => m._id === actualId);

                            if (otherMember?.avatar) {
                                return (
                                    <img
                                        src={otherMember.avatar}
                                        alt={otherMember.name}
                                        className="w-10 h-10 rounded-xl object-cover border border-gray-200 shrink-0"
                                    />
                                );
                            } else if (otherMember) {
                                return (
                                    <div className="w-10 h-10 bg-indigo-100 rounded-xl hidden sm:flex items-center justify-center text-indigo-700 font-bold text-lg shrink-0">
                                        {otherMember.name.charAt(0).toUpperCase()}
                                    </div>
                                );
                            }
                        }

                        // Default icon for normal groups or main room
                        return (
                            <div className="w-10 h-10 bg-brand-100 rounded-lg hidden sm:flex items-center justify-center text-brand-600 shrink-0">
                                <Hash size={20} />
                            </div>
                        );
                    })()}
                    <div>
                        <h1 className="text-lg font-bold text-gray-800 tracking-tight">
                            {currentGroup ? (currentGroup.isDM ? '' : '# ') + currentGroup.groupName : (currentRoom?.roomName || 'Room')}
                        </h1>
                        <p className="text-xs font-medium text-gray-500">
                            {currentGroup ? (currentGroup.isDM ? 'Direct Message' : 'Subgroup Chat') : 'Main Trip Chat'}
                        </p>
                    </div>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 relative z-0">
                {messages.map((msg, idx) => {
                    const isMe = msg.sender?._id === userInfo?._id;
                    return (
                        <div key={idx} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                            {!isMe && <span className="text-xs font-medium text-gray-500 mb-1 ml-1">{msg.sender?.name}</span>}
                            <div className={`px-4 py-2.5 rounded-2xl max-w-[85%] sm:max-w-md ${isMe ? 'bg-brand-600 text-white rounded-tr-sm' : 'bg-white text-gray-800 shadow-sm border border-gray-100 rounded-tl-sm'}`}>
                                <p className="text-[15px] leading-relaxed break-words">{msg.message}</p>
                                <div className={`text-[10px] mt-1 text-right ${isMe ? 'text-brand-200' : 'text-gray-400'}`}>
                                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            <div className="bg-white p-3 sm:p-4 border-t border-gray-200">
                <form onSubmit={sendMessage} className="flex space-x-2 sm:space-x-4 max-w-4xl mx-auto">
                    <input
                        type="text"
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        className="flex-1 px-4 py-3 bg-gray-100 border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-500 outline-none transition-all placeholder-gray-400"
                        placeholder="Type a message..."
                    />
                    <button
                        type="submit"
                        disabled={!inputMessage.trim()}
                        className="bg-brand-600 text-white p-3 sm:px-6 rounded-xl hover:bg-brand-700 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed shadow-sm font-medium"
                    >
                        <Send size={20} className="sm:mr-2" />
                        <span className="hidden sm:inline">Send</span>
                    </button>
                </form>
            </div>
        </div >
    );
};

export default ChatBox;
