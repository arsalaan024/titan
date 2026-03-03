import React, { useState, useRef } from 'react';
import { StorageMode } from '../types';

interface MediaInputProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
    storageMode: StorageMode;
    type?: 'image' | 'video' | 'document';
    placeholder?: string;
    className?: string;
}

const formatStorageLink = (link: string): string => {
    if (!link) return '';
    try {
        const url = new URL(link);
        // Google Drive conversion
        if (url.hostname.includes('drive.google.com')) {
            const fileId = url.pathname.split('/d/')[1]?.split('/')[0] || url.searchParams.get('id');
            if (fileId) return `https://drive.google.com/uc?export=view&id=${fileId}`;
        }
        // Dropbox conversion
        if (url.hostname.includes('dropbox.com')) {
            return link.replace('www.dropbox.com', 'dl.dropboxusercontent.com').replace('?dl=0', '').replace('&dl=0', '');
        }
    } catch (e) {
        // Not a URL, return as is (could be base64)
    }
    return link;
};

const MediaInput: React.FC<MediaInputProps> = ({
    label,
    value,
    onChange,
    storageMode,
    type = 'image',
    placeholder,
    className = ""
}) => {
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const displayValue = formatStorageLink(value);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            // Check file size (limit to 5MB for b64/D1 safety for now)
            if (file.size > 5 * 1024 * 1024) {
                alert('File too large. Please keep under 5MB for direct database storage.');
                setUploading(false);
                return;
            }

            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result as string;
                onChange(result);
                setUploading(false);
            };
            reader.onerror = () => {
                alert('Error reading file.');
                setUploading(false);
            };
            reader.readAsDataURL(file);
        } catch (err) {
            console.error('Upload failed:', err);
            alert('Upload failed. Please try again.');
            setUploading(false);
        }
    };

    const getIcon = () => {
        switch (type) {
            case 'video': return 'fa-video';
            case 'document': return 'fa-file-lines';
            default: return 'fa-image';
        }
    };

    return (
        <div className={`space-y-2 ${className}`}>
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                <i className={`fa-solid ${getIcon()}`}></i> {label}
            </label>

            {storageMode === 'google_drive' ? (
                <div className="relative group">
                    <input
                        type="text"
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder={placeholder || `Paste ${type} link (Google Drive, Dropbox, etc.)`}
                        className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-6 py-4 text-sm font-semibold outline-none focus:border-[#800000]/20 transition-all placeholder:text-gray-300 shadow-inner"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none opacity-40 group-focus-within:opacity-100 transition-opacity">
                        <i className="fa-brands fa-google-drive text-[#800000]"></i>
                        <span className="text-[8px] font-black uppercase tracking-tighter">Link Mode</span>
                    </div>
                </div>
            ) : (
                <div className="flex gap-3">
                    <div className="flex-grow relative group">
                        <input
                            type="text"
                            value={value.startsWith('data:') ? 'Local File Selected' : value}
                            readOnly
                            onClick={() => fileInputRef.current?.click()}
                            placeholder={placeholder || `Select ${type} from device`}
                            className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-6 py-4 text-sm font-semibold outline-none cursor-pointer placeholder:text-gray-300 shadow-inner group-hover:border-[#800000]/10 transition-all"
                        />
                        {value && (
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                <div className="w-8 h-8 rounded-lg overflow-hidden border border-gray-200 bg-white">
                                    {type === 'image' && <img src={displayValue} alt="Preview" className="w-full h-full object-cover" />}
                                    {type !== 'image' && <div className="w-full h-full flex items-center justify-center text-[10px] text-[#800000]"><i className={`fa-solid ${getIcon()}`}></i></div>}
                                </div>
                            </div>
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="bg-[#800000] text-white px-6 rounded-2xl flex items-center justify-center hover:bg-[#6b0000] transition-all shadow-lg active:scale-95 disabled:opacity-50"
                        title="Upload File"
                    >
                        {uploading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <i className="fa-solid fa-cloud-arrow-up text-lg"></i>
                        )}
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept={type === 'image' ? 'image/*' : type === 'video' ? 'video/*' : '*/*'}
                        onChange={handleFileChange}
                        className="hidden"
                    />
                </div>
            )}

            <div className="flex justify-between items-center px-2">
                <p className="text-[8px] font-bold text-gray-300 uppercase tracking-widest">
                    Strategy: <span className="text-[#800000]">{storageMode === 'google_drive' ? 'External Link' : 'Direct Database'}</span>
                </p>
                {value && (
                    <button
                        type="button"
                        onClick={() => onChange('')}
                        className="text-[8px] font-black text-red-400 uppercase tracking-widest hover:text-red-600 transition-colors"
                    >
                        Clear Asset
                    </button>
                )}
            </div>
        </div>
    );
};

export default MediaInput;
