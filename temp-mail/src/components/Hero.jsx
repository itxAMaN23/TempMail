import React from 'react';
import { useEffect, useState } from 'react';
import axios from 'axios';
import MessageBox from './MessageBox';
import { IoCopy } from "react-icons/io5";
import { SiTicktick } from "react-icons/si";
import { MdEmail } from "react-icons/md";
import { FaCircleInfo } from "react-icons/fa6";
import { MdDelete } from "react-icons/md";
import './Hero.css'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const Hero = () => {

    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    const [messages, setMessages] = useState([]);
    const [messagesLoading, setMessagesLoading] = useState(false);
    const [messagesError, setMessagesError] = useState(null);

    const [selectedMessage, setSelectedMessage] = useState(null);
    const [showTick, setShowTick] = useState(false);
    const [showToast, setShowToast] = useState(false);

    useEffect(() => {
        const storedEmail = localStorage.getItem('email');
        const storedToken = localStorage.getItem('authToken');
        
        if (storedEmail && storedToken) {
            setLoading(true);
            setEmail(storedEmail);

            const fetchInitialMessages = async () => {
                try {
                    const response = await axios.get(`${BACKEND_URL}/api/mail/messages`, {
                        headers: { "Authorization": `Bearer ${storedToken}` }
                    });
                    const allMessages = response.data["hydra:member"];
                    setMessages(allMessages);
                } catch (error) {
                    setMessagesError(error.message || 'An error occurred while fetching messages.');
                } finally {
                    setLoading(false);
                }
            };

            fetchInitialMessages();

        }
    }, []);


    const getMail = async () => {
        setLoading(true)
        setError(null)
        try {
            const response = await axios.get(`${BACKEND_URL}/api/mail/generate`);

            if (response.data.email) {
                setEmail(response.data.email || '');

                localStorage.setItem('authToken', response.data.data.token);
                localStorage.setItem('email', response.data.email);

                setMessages([]);
            }

        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false)
        }
    }

    const getMsgs = async () => {

        if (!email) {
            setError('Please generate an email first.');
            setTimeout(() => setError(null), 2000);
            return;
        }

        setMessagesLoading(true);
        setMessagesError(null);

        try {
            const response = await axios.get(`${BACKEND_URL}/api/mail/messages`, { headers: { "Authorization": `Bearer ${localStorage.getItem('authToken')}` } });
            const allMessages = response.data["hydra:member"];
            setMessages(allMessages);

        } catch (error) {
            setMessagesError(error.message || 'An error occurred while fetching messages.');
        } finally {
            setMessagesLoading(false);
            setTimeout(() => setMessagesError(null), 2000);
        }
    };

    const fetchMessageById = async (messageId) => {
        setMessagesLoading(true);
        try {
            const response = await axios.get(`${BACKEND_URL}/api/mail/messages/${messageId}`, {
                headers: {
                    "Authorization": `Bearer ${localStorage.getItem('authToken')}`
                }
            });

            // Mark message as read before showing it
            await axios.patch(`${BACKEND_URL}/api/mail/messages/${messageId}/read`, { seen: true }, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('authToken')}`,
                    "Content-Type": "application/merge-patch+json"
                }
            });

            // Update messages state to reflect the change
            setMessages(messages.map(msg => msg.id === messageId ? { ...msg, seen: true } : msg));
            setSelectedMessage(response.data); // Store the full message details
        } catch (error) {
            console.error('Error fetching message details:', error);
            setMessagesError(error.message || 'Failed to load message details.');
        } finally {
            setMessagesLoading(false);
            setTimeout(() => setMessagesError(null), 2000);
        }
    };

    const handleMessageClick = (message) => {
        fetchMessageById(message.id); // Fetch the full message by ID
    };

    const closeMessageBox = () => {
        setSelectedMessage(null); // Close the modal
    };

    const handleCopy = () => {
        if (email) {
            navigator.clipboard.writeText(email)
                .then(() => {
                    setShowTick(true);
                    setShowToast(true);
                    setTimeout(() => setShowTick(false), 2000);
                    setTimeout(() => setShowToast(false), 2000);

                })
                .catch((error) => {
                    console.error('Error copying email:', error)
                });
        }
    }

    const handleDeleteMessage = async (message) => {

        const messageId = message.id;
        setMessagesLoading(true);

        if (!window.confirm('Are you sure you want to delete this message?')) {
            return;
        }

        try {
            const response = await axios.delete(`${BACKEND_URL}/api/mail/messages/${messageId}`, {
                headers: {
                    "Authorization": `Bearer ${localStorage.getItem('authToken')}`
                }
            });

            if (response.status === 204) {
                setMessages(messages.filter(msg => msg.id !== messageId));
                setMessagesError('Message deleted successfully.');
                setTimeout(() => setMessagesError(null), 2000);
            }
        } catch (error) {
            setMessagesError(error.message || 'Failed to delete message.');
        } finally {
            setMessagesLoading(false);
        }
    }

    return (
        <>

            {showToast && (
                <div className="msg fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-green-500 text-white px-6 py-3 rounded-full shadow-lg transition-all duration-300">
                    Copied!
                </div>
            )}

            {(error || messagesError) && (
                <div
                    className="msg fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-red-600 text-white px-6 py-3 rounded-full shadow-lg transition-all duration-300 flex items-center justify-center gap-2">
                    <FaCircleInfo /> {error || messagesError}
                </div>
            )}

            {(loading || messagesLoading) && (
                <div className="fixed top-0 left-0 h-1 bg-blue-600 loading-bar rounded-full pointer-events-none"></div>
            )}

            <div className="min-h-screen bg-gray-900 flex items-center justify-center p-[5rem] transition-colors duration-500" style={{ "fontFamily": "Montserrat" }}>

                <div className="w-full max-w-3xl">
                    
                    <header className="text-center mb-12">
                        <h1 className="text-6xl font-bold text-white mb-4 transition-colors duration-300 hover:text-gray-300 tracking-[10px]" style={{ "fontFamily": "Bebas Neue" }}>
                            TempMail Generator
                        </h1>
                        <p className="text-xl text-gray-400 transition-colors duration-300 hover:text-gray-200" >
                            Get your temporary email address instantly!
                        </p>
                    </header>

                    <section className="mb-12">
                        <div className="bg-gray-800 rounded-lg shadow-lg p-8 flex flex-col md:flex-row items-center transition-shadow duration-300 hover:shadow-2xl">
                            <div className="w-full md:flex-1 relative mb-4 md:mb-0 md:mr-4">
                                <MdEmail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    readOnly
                                    value={email || ''}
                                    placeholder="Click generate to create a temporary email address"
                                    className="w-full px-9 py-3 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300"
                                />

                                {!showTick ?

                                    <IoCopy
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 cursor-pointer hover:text-gray-300" onClick={handleCopy} />
                                    :
                                    <SiTicktick className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 cursor-pointer hover:text-gray-300 pointer-events-none" />

                                }

                            </div>
                            <button
                                onClick={getMail}
                                disabled={loading}
                                className={`w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white font-medium px-8 py-3 rounded-md transition-all duration-300 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                {loading ? 'Loading...' : 'Generate'}
                            </button>
                        </div>

                    </section>


                    <section>
                        <div className="bg-gray-800 rounded-lg shadow-lg p-8 transition-shadow duration-300 hover:shadow-2xl">
                            <div className="inbox flex items-center justify-between mb-6">
                                <h2 className="text-3xl font-semibold text-white">
                                    Inbox
                                </h2>
                                <div className="space-x-2">
                                    <button onClick={getMsgs} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition-all duration-300">
                                        {messagesLoading ? 'Refreshing...' : 'Refresh'}
                                    </button>
                                </div>
                            </div>

                            <ul className="divide-y divide-gray-700 min-h-[200px]">
                                {messages.length > 0 ? (
                                    messages.map((message, index) => (
                                        <li key={index} className="relative py-4 px-6 mb-2 bg-gray-700 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 border border-gray-700 hover:bg-gray-600">
                                            <div className="flex items-start justify-between cursor-pointer" onClick={() => handleMessageClick(message)}>
                                                <div className="flex-1">
                                                    <h3 className="text-lg font-semibold text-white">
                                                        {message.subject || `Message ${index + 1}`}
                                                    </h3>
                                                    <p className="text-gray-300 text-sm line-clamp-2 mt-1">
                                                        {message.intro || 'No preview available'}
                                                    </p>
                                                    <p className="text-gray-400 text-xs mt-2">
                                                        From: {message.from?.name || message.from?.address || 'Unknown Sender'} |{' '}
                                                        {new Date(message.createdAt).toLocaleString()}
                                                    </p>
                                                </div>
                                                <div className="ml-4 flex-shrink-0">
                                                    <span
                                                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${message.seen ? 'bg-green-800 text-green-100' : 'bg-blue-800 text-blue-100'
                                                            }`}
                                                    >
                                                        {message.seen ? 'Read' : 'New'}
                                                    </span>
                                                </div>
                                            </div>
                                            <span className="absolute right-4 bottom-4 text-gray-400 text-2xl p-2 z-49">
                                                <MdDelete className="hover:text-gray-300 cursor-pointer" onClick={() => handleDeleteMessage(message)} />
                                            </span>
                                        </li>

                                    ))
                                ) : messagesError ? (
                                    <li className="py-4 px-6 text-red-500"> {messagesError}</li>
                                ) : (
                                    <li className="flex flex-col items-center justify-center py-8">
                                        <p className="mt-4 text-gray-400 text-2xl animate-pulse">
                                            Waiting for emails...
                                        </p>
                                        <img
                                            src="/waiting.png"
                                            alt="Waiting for Emails"
                                            className="w-1/2 mx-auto animate-pulse mix-blend-difference"
                                        />

                                    </li>
                                )}
                            </ul>
                        </div>
                    </section>

                    <MessageBox message={selectedMessage} onClose={closeMessageBox} />
                </div>
            </div>
        </>
    );
};

export default Hero;
