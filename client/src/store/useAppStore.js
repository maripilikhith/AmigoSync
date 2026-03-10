import { create } from 'zustand';

const useAppStore = create((set) => ({
    userInfo: JSON.parse(localStorage.getItem('userInfo')) || null,
    currentRoom: null,
    currentGroup: null,
    messages: [],
    onlineUsers: [],
    members: [], // All members of the current room

    setUserInfo: (info) => {
        if (info) {
            localStorage.setItem('userInfo', JSON.stringify(info));
        } else {
            localStorage.removeItem('userInfo');
        }
        set({ userInfo: info });
    },

    setCurrentRoom: (room) => set({ currentRoom: room }),
    setCurrentGroup: (group) => set({ currentGroup: group }),

    setMembers: (members) => set({ members }),

    setMessages: (messages) => set({ messages }),
    addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),

    setOnlineUsers: (users) => set({ onlineUsers: users }),
    updateOnlineUser: (user) => set((state) => ({
        // Using userId as key ensures uniqueness
        onlineUsers: { ...state.onlineUsers, [user.userId]: user }
    })),

    logout: () => {
        localStorage.removeItem('userInfo');
        set({ userInfo: null, currentRoom: null, currentGroup: null, messages: [], onlineUsers: [], members: [] });
    }
}));

export default useAppStore;
