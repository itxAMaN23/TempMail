import React, { useState } from 'react';
import { RiAttachment2, RiCloseLine } from "react-icons/ri";
import { FaFilePdf, FaFileImage, FaFileArchive, FaFileExcel, FaFileWord, FaFileAudio, FaFileVideo, FaFileCode, FaFileCsv, FaFilePowerpoint, FaFileAlt, FaGlobe } from "react-icons/fa";
import axios from 'axios';
import './MessageBox.css';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const getFileTypeInfo = (attachment) => {
    const { contentType = '', filename = '' } = attachment;
    const lowerFilename = filename.toLowerCase();
    const extension = lowerFilename.split('.').pop();

    if (contentType.startsWith('image/') ||
        ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(extension)) {
        return {
            type: 'Image',
            icon: <FaFileImage className="text-green-400 text-xl" />,
            color: 'bg-green-400/20',
            previewable: true,
            previewType: 'image'
        };
    }

    if (contentType === 'application/pdf' || extension === 'pdf') {
        return {
            type: 'PDF',
            icon: <FaFilePdf className="text-red-400 text-xl" />,
            color: 'bg-red-400/20',
            previewable: true,
            previewType: 'pdf'
        };
    }

    if (contentType.includes('spreadsheet') ||
        contentType.includes('excel') ||
        ['xls', 'xlsx', 'csv', 'numbers'].includes(extension)) {
        const isCsv = extension === 'csv';
        return {
            type: isCsv ? 'CSV' : 'Spreadsheet',
            icon: isCsv ? <FaFileCsv className="text-green-500 text-xl" /> : <FaFileExcel className="text-green-500 text-xl" />,
            color: 'bg-green-500/20',
            previewable: isCsv,
            previewType: isCsv ? 'text' : 'download'
        };
    }

    if (contentType.includes('word') ||
        contentType.includes('document') ||
        ['doc', 'docx', 'odt', 'rtf'].includes(extension)) {
        return {
            type: 'Document',
            icon: <FaFileWord className="text-blue-500 text-xl" />,
            color: 'bg-blue-500/20',
            previewable: false,
            previewType: 'download'
        };
    }

    if (contentType.includes('presentation') ||
        ['ppt', 'pptx', 'key', 'odp'].includes(extension)) {
        return {
            type: 'Presentation',
            icon: <FaFilePowerpoint className="text-orange-500 text-xl" />,
            color: 'bg-orange-500/20',
            previewable: false,
            previewType: 'download'
        };
    }

    if (contentType.includes('zip') ||
        contentType.includes('rar') ||
        contentType.includes('tar') ||
        contentType.includes('gzip') ||
        ['zip', 'rar', 'tar', 'gz', '7z', 'bz2'].includes(extension)) {
        return {
            type: 'Archive',
            icon: <FaFileArchive className="text-yellow-400 text-xl" />,
            color: 'bg-yellow-400/20',
            previewable: false,
            previewType: 'download'
        };
    }

    if (contentType.startsWith('audio/') ||
        ['mp3', 'wav', 'ogg', 'flac', 'm4a', 'aac'].includes(extension)) {
        return {
            type: 'Audio',
            icon: <FaFileAudio className="text-purple-400 text-xl" />,
            color: 'bg-purple-400/20',
            previewable: true,
            previewType: 'audio'
        };
    }

    if (contentType.startsWith('video/') ||
        ['mp4', 'avi', 'mov', 'wmv', 'mkv', 'webm', 'flv'].includes(extension)) {
        return {
            type: 'Video',
            icon: <FaFileVideo className="text-indigo-400 text-xl" />,
            color: 'bg-indigo-400/20',
            previewable: true,
            previewType: 'video'
        };
    }

    if (contentType.startsWith('text/') ||
        ['html', 'css', 'js', 'jsx', 'ts', 'tsx', 'php', 'py', 'json', 'xml', 'yaml', 'yml', 'md'].includes(extension)) {
        if (['html', 'htm'].includes(extension)) {
            return {
                type: 'HTML',
                icon: <FaGlobe className="text-blue-400 text-xl" />,
                color: 'bg-blue-400/20',
                previewable: true,
                previewType: 'html'
            };
        }
        return {
            type: 'Code',
            icon: <FaFileCode className="text-gray-400 text-xl" />,
            color: 'bg-gray-400/20',
            previewable: true,
            previewType: 'text'
        };
    }

    if (['txt', 'log', 'text'].includes(extension)) {
        return {
            type: 'Text',
            icon: <FaFileAlt className="text-gray-300 text-xl" />,
            color: 'bg-gray-300/20',
            previewable: true,
            previewType: 'text'
        };
    }

    return {
        type: 'File',
        icon: <RiAttachment2 className="text-blue-400 text-xl" />,
        color: 'bg-blue-400/10',
        previewable: false,
        previewType: 'download'
    };
};

const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';

    const units = ['KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    const value = bytes / Math.pow(1024, i);
    return `${value.toFixed(i > 0 ? 1 : 0)} ${units[i]}`;
};

const MessageBox = ({ message, onClose }) => {
    const [preview, setPreview] = useState({
        show: false,
        type: null,
        url: null,
        content: null,
        title: null
    });

    if (!message) return null;

    const htmlContent = message.html?.[0] || message.body || message.intro || 'No message content available';

    const handleAttachment = async (attachment, action) => {
        try {
            const response = await axios.get(
                `${BACKEND_URL}/api/mail/messages/${message.id}/attachment/${attachment.id}`,
                {
                    headers: {
                        "Authorization": `Bearer ${localStorage.getItem('authToken')}`
                    },
                    responseType: 'arraybuffer'
                }
            );

            const blob = new Blob([response.data], { type: attachment.contentType || 'application/octet-stream' });
            const blobUrl = URL.createObjectURL(blob);
            const fileInfo = getFileTypeInfo(attachment);

            if (action === 'download') {

                const link = document.createElement('a');
                link.href = blobUrl;
                link.download = attachment.filename;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);

            } else if (action === 'view') {
                if (!fileInfo.previewable) {

                    const link = document.createElement('a');
                    link.href = blobUrl;
                    link.download = attachment.filename;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);

                } else {

                    switch (fileInfo.previewType) {
                        case 'image':
                            setPreview({
                                show: true,
                                type: 'image',
                                url: blobUrl,
                                title: attachment.filename
                            });
                            break;

                        case 'pdf':
                            window.open(blobUrl, '_blank');
                            break;

                        case 'audio':
                            setPreview({
                                show: true,
                                type: 'audio',
                                url: blobUrl,
                                title: attachment.filename
                            });
                            break;

                        case 'video':
                            setPreview({
                                show: true,
                                type: 'video',
                                url: blobUrl,
                                title: attachment.filename
                            });
                            break;

                        case 'text':
                        case 'html':

                            fetch(blobUrl)
                                .then(response => response.text())
                                .then(content => {
                                    setPreview({
                                        show: true,
                                        type: fileInfo.previewType,
                                        content: content,
                                        title: attachment.filename
                                    });
                                });
                            break;

                        default:
                            window.open(blobUrl, '_blank');
                    }
                }
            }

            if (!(action === 'view' && fileInfo.previewable && fileInfo.previewType !== 'pdf')) {
                setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
            }
        } catch (error) {
            console.error("Error handling attachment:", error.message);
        }
    };

    const closePreview = () => {
        if (preview.url) {
            URL.revokeObjectURL(preview.url);
        }
        setPreview({ show: false, type: null, url: null, content: null, title: null });
    };

    const renderPreview = () => {
        if (!preview.show) return null;

        return (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[60] p-4">
                <div className="bg-gray-900 rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden border border-gray-700/50 flex flex-col">
                    <div className="p-4 border-b border-gray-800 flex justify-between items-center">
                        <h3 className="text-white font-medium truncate">{preview.title}</h3>
                        <button
                            onClick={closePreview}
                            className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-gray-700"
                        >
                            <RiCloseLine size={24} />
                        </button>
                    </div>

                    <div className="flex-1 flex items-center justify-center bg-gray-800 overflow-auto p-4">
                        {preview.type === 'image' && (
                            <img
                                src={preview.url}
                                alt={preview.title}
                                className="max-w-full max-h-[calc(90vh-6rem)] object-contain"
                            />
                        )}

                        {preview.type === 'audio' && (
                            <div className="w-full max-w-2xl p-6 bg-gray-900 rounded-lg">
                                <audio controls className="w-full" autoPlay>
                                    <source src={preview.url} type="audio/*" />
                                    Your browser does not support the audio element.
                                </audio>
                            </div>
                        )}

                        {preview.type === 'video' && (
                            <video
                                controls
                                autoPlay
                                className="max-w-full max-h-[calc(90vh-6rem)]"
                            >
                                <source src={preview.url} type="video/*" />
                                Your browser does not support the video element.
                            </video>
                        )}

                        {(preview.type === 'text' || preview.type === 'html') && (
                            <div className="w-full h-full overflow-auto bg-gray-900 p-4 rounded">
                                <pre className="text-gray-300 font-mono text-sm whitespace-pre-wrap">
                                    {preview.content}
                                </pre>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <>
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="bg-gray-900 rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto border border-gray-700/50 flex flex-col">

                    <div className="p-6 border-b border-gray-800">
                        <div className="space-y-3">
                            <div className="flex items-baseline justify-between">
                                <p className="text-white font-medium">
                                    <span className="text-gray-400 mr-2">From:</span>
                                    <span className="text-blue-400 font-semibold">{message.from.name}</span>
                                    <span className="text-gray-500 md:text-sm ml-2 sm:text-xs">&lt;{message.from.address}&gt;</span>
                                </p>
                                <span className="text-gray-500 text-sm ">{new Date(message.createdAt).toLocaleString()}</span>
                            </div>
                            <p className="text-gray-300 text-sm">
                                <span className="text-gray-400 mr-2">To:</span>
                                <span>{message.to[0].address || 'Unknown Recipient'}</span>
                            </p>
                        </div>
                    </div>


                    <div className="flex-1 pt-6 px-6">
                        <h2 className="text-2xl font-bold text-white border-l-4 border-blue-500 pl-3 py-1 text-balance">
                            {message.subject || 'No Subject'}
                        </h2>
                    </div>
                    <div className="flex-1 p-4 m-1 flex flex-col max-[400px]:p-1 max-[400px]:m-0">
                        <div className="text-gray-200 prose prose-invert w-full flex-1 max-[400px]:text-sm max-[400px]:prose-sm">
                            <div className="content bg-gray-800/50 rounded-lg p-4 shadow-inner flex flex-col h-full max-[400px]:p-2 max-[400px]:rounded max-[400px]:w-[90%] max-[400px]:m-auto max-[400px]:text-xs">
                                <div className="w-full h-full overflow-auto break-words whitespace-normal" dangerouslySetInnerHTML={{ __html: htmlContent }} />
                            </div>
                        </div>
                    </div>

                    {message.hasAttachments && message.attachments.length > 0 && (
                        <div className="px-6 pb-4">
                            <h3 className="attachments text-lg font-semibold text-white flex items-center gap-2 mb-3">
                                <RiAttachment2 className="text-blue-400" />
                                Attachments ({message.attachments.length})
                            </h3>
                            <div className="space-y-2">
                                {message.attachments.map(attachment => {
                                    const fileInfo = getFileTypeInfo(attachment);
                                    return (
                                        <div key={attachment.id} className="flex items-center bg-gray-800/70 p-3 rounded-lg hover:bg-gray-800 transition-colors">
                                            <div className={`w-10 h-10 rounded ${fileInfo.color} flex items-center justify-center mr-3 max-[680px]:mr-0`}>
                                                {fileInfo.icon}
                                            </div>
                                            <div className="flex-1 max-w-[-webkit-fill-available] text-center">
                                                <p className="font-medium text-gray-200 truncate">{attachment.filename}</p>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-xs text-gray-400">{formatFileSize(attachment.size)}</span>
                                                    <span className={`text-xs px-2 py-0.5 rounded-full ${fileInfo.color} text-white`}>
                                                        {fileInfo.type}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex gap-2 ml-2">
                                                <button
                                                    onClick={() => handleAttachment(attachment, 'view')}
                                                    className="text-sm px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-md transition-colors"
                                                >
                                                    {fileInfo.previewable ? 'Preview' : 'Open'}
                                                </button>
                                                <button
                                                    onClick={() => handleAttachment(attachment, 'download')}
                                                    className="text-sm px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-md transition-colors"
                                                >
                                                    Download
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    <div className="p-4 border-t border-gray-800 flex justify-end">
                        <button
                            onClick={onClose}
                            className="bg-blue-600 hover:bg-blue-500 text-white font-medium px-5 py-2.5 rounded-md transition-all duration-200 flex items-center"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>

            {renderPreview()}
        </>
    );
};

export default MessageBox;
