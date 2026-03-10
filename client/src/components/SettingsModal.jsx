import React, { useState } from 'react';
import toast from 'react-hot-toast';
import api from '../services/api';
import useAppStore from '../store/useAppStore';
import { X, LogOut } from 'lucide-react';

const SettingsModal = ({ isOpen, onClose }) => {
    const { userInfo, setUserInfo, logout } = useAppStore();
    const [name, setName] = useState(userInfo?.name || '');
    const [phone, setPhone] = useState(userInfo?.phone || '');
    const [avatar, setAvatar] = useState(userInfo?.avatar || '');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const uploadToCloudinary = async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        // Replace 'your_upload_preset' with the actual preset
        formData.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'ml_default');

        const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
        if (!cloudName) {
            throw new Error("Missing Cloudinary Cloud Name in .env");
        }

        const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            throw new Error(`Cloudinary error: ${response.statusText}`);
        }

        const data = await response.json();
        return data.secure_url;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            let finalAvatarUrl = avatar;
            if (selectedFile) {
                setUploadingImage(true);
                toast.loading('Uploading image...', { id: 'uploadToast' });
                finalAvatarUrl = await uploadToCloudinary(selectedFile);
                toast.success('Image uploaded!', { id: 'uploadToast' });
                setAvatar(finalAvatarUrl);
                setUploadingImage(false);
            }

            const payload = { name, phone, avatar: finalAvatarUrl };
            if (newPassword) {
                payload.password = newPassword;
                payload.currentPassword = currentPassword;
            }

            const { data } = await api.put('/users/profile', payload);
            setUserInfo({ ...userInfo, ...data });
            toast.success('Profile updated successfully!');
            setSelectedFile(null);
            setCurrentPassword('');
            setNewPassword('');
            onClose();
        } catch (error) {
            toast.dismiss('uploadToast');
            setUploadingImage(false);
            toast.error(error.message || error.response?.data?.message || 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative animate-in fade-in zoom-in duration-200">
                <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50">
                    <h2 className="text-xl font-bold text-gray-800">Account Settings</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 bg-gray-200 hover:bg-gray-300 rounded-full p-1.5 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                        <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Profile Photo</label>
                        <div className="flex items-center space-x-4">
                            {avatar || selectedFile ? (
                                <img
                                    src={selectedFile ? URL.createObjectURL(selectedFile) : avatar}
                                    alt="Preview"
                                    className="w-16 h-16 rounded-full object-cover border border-gray-200"
                                />
                            ) : (
                                <div className="w-16 h-16 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 font-bold text-2xl border border-gray-200 shrink-0">
                                    {name?.charAt(0).toUpperCase() || userInfo?.name.charAt(0).toUpperCase()}
                                </div>
                            )}
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => setSelectedFile(e.target.files[0])}
                                className="w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100 transition-colors"
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                            <input
                                type="password"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                                placeholder="Leave blank to keep"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                                placeholder="New password"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                        <input
                            type="email"
                            value={userInfo?.email}
                            disabled
                            className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-xl text-gray-500 cursor-not-allowed"
                        />
                        <p className="text-xs text-gray-400 mt-1">Email cannot be changed.</p>
                    </div>

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={loading || uploadingImage}
                            className="w-full py-3 bg-brand-600 text-white rounded-xl font-semibold hover:bg-brand-700 transition-colors shadow-sm disabled:opacity-50"
                        >
                            {loading || uploadingImage ? 'Saving...' : 'Save Changes'}
                        </button>

                        <button
                            type="button"
                            onClick={logout}
                            className="w-full py-3 bg-red-50 text-red-600 rounded-xl font-semibold hover:bg-red-100 transition-colors shadow-sm mt-3 flex justify-center items-center"
                        >
                            <LogOut className="mr-2" size={18} /> Logout
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SettingsModal;
