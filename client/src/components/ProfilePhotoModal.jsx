import React from 'react';
import { X } from 'lucide-react';

const ProfilePhotoModal = ({ isOpen, onClose, name, avatarUrl }) => {
    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <div
                className="relative bg-white rounded-2xl shadow-2xl overflow-hidden max-w-sm w-full animate-in fade-in zoom-in duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 z-10 bg-black/40 hover:bg-black/60 text-white rounded-full p-1.5 transition-colors"
                >
                    <X size={18} />
                </button>

                {avatarUrl ? (
                    <img
                        src={avatarUrl}
                        alt={name}
                        className="w-full aspect-square object-cover"
                    />
                ) : (
                    <div className="w-full aspect-square bg-gradient-to-br from-brand-400 to-indigo-500 flex items-center justify-center">
                        <span className="text-white text-8xl font-bold">
                            {name?.charAt(0).toUpperCase()}
                        </span>
                    </div>
                )}

                <div className="p-4 text-center">
                    <p className="text-lg font-bold text-gray-800">{name}</p>
                </div>
            </div>
        </div>
    );
};

export default ProfilePhotoModal;
