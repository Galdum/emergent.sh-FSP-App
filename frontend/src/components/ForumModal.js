import React, { useEffect, useState } from "react";
import { Lock, MessageCircle, Send, Hash, PlusCircle } from "react-feather";

const API = "/api/forum";

export default function ForumModal({ isOpen, onClose, isPremium }) {
  const [channels, setChannels] = useState([]);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [threads, setThreads] = useState([]);
  const [selectedThread, setSelectedThread] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newThreadTitle, setNewThreadTitle] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Fetch channels
  useEffect(() => {
    if (!isOpen || !isPremium) return;
    setLoading(true);
    fetch(`${API}/channels`)
      .then((r) => r.json())
      .then(setChannels)
      .catch(() => setError("Eroare la încărcarea canalelor."))
      .finally(() => setLoading(false));
  }, [isOpen, isPremium]);

  // Fetch threads when channel changes
  useEffect(() => {
    if (!selectedChannel || !isPremium) return;
    setLoading(true);
    fetch(`${API}/channels/${selectedChannel.id}/threads`)
      .then((r) => r.json())
      .then(setThreads)
      .catch(() => setError("Eroare la încărcarea discuțiilor."))
      .finally(() => setLoading(false));
  }, [selectedChannel, isPremium]);

  // Fetch messages when thread changes
  useEffect(() => {
    if (!selectedThread || !isPremium) return;
    setLoading(true);
    fetch(`${API}/threads/${selectedThread.id}/messages`)
      .then((r) => r.json())
      .then(setMessages)
      .catch(() => setError("Eroare la încărcarea mesajelor."))
      .finally(() => setLoading(false));
  }, [selectedThread, isPremium]);

  const handleCreateThread = () => {
    if (!newThreadTitle.trim()) return;
    setLoading(true);
    fetch(`${API}/channels/${selectedChannel.id}/threads`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newThreadTitle }),
    })
      .then((r) => r.json())
      .then((thread) => {
        setThreads((t) => [...t, thread]);
        setNewThreadTitle("");
      })
      .catch(() => setError("Eroare la crearea discuției."))
      .finally(() => setLoading(false));
  };

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    setLoading(true);
    fetch(`${API}/threads/${selectedThread.id}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: newMessage }),
    })
      .then((r) => r.json())
      .then((msg) => {
        setMessages((m) => [...m, msg]);
        setNewMessage("");
      })
      .catch(() => setError("Eroare la trimiterea mesajului."))
      .finally(() => setLoading(false));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 animate-fade-in-fast">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[80vh] flex overflow-hidden relative animate-scale-in">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-800 transition-colors z-20"
        >
          <Lock size={28} />
        </button>
        {!isPremium ? (
          <div className="flex flex-col items-center justify-center w-full h-full text-center p-10">
            <Lock size={48} className="text-gray-400 mb-4" />
            <h2 className="text-2xl font-bold mb-2 text-gray-700">
              Forum Premium
            </h2>
            <p className="text-gray-500 mb-4">
              Accesibil doar pentru utilizatorii cu abonament Premium.
            </p>
            <button
              onClick={onClose}
              className="bg-orange-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-orange-600 transition"
            >
              Upgrade la Premium
            </button>
          </div>
        ) : (
          <div className="flex w-full h-full">
            {/* Sidebar: Channels */}
            <div className="w-1/4 bg-gradient-to-b from-orange-100 to-orange-200 p-4 flex flex-col gap-4 border-r-2 border-orange-300">
              <h3 className="text-lg font-bold text-orange-700 mb-2 flex items-center gap-2">
                <Hash size={20} />
                Canale
              </h3>
              {loading ? (
                <div>Se încarcă...</div>
              ) : channels.length === 0 ? (
                <div className="text-gray-400">Niciun canal.</div>
              ) : (
                <ul className="space-y-2">
                  {channels.map((ch) => (
                    <li key={ch.id}>
                      <button
                        onClick={() => {
                          setSelectedChannel(ch);
                          setSelectedThread(null);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-lg font-medium transition ${selectedChannel?.id === ch.id ? "bg-orange-400 text-white" : "hover:bg-orange-200 text-orange-800"}`}
                      >
                        {ch.name}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {/* Main: Threads & Messages */}
            <div className="flex-1 flex flex-col h-full">
              {/* Threads */}
              <div className="flex items-center justify-between p-4 border-b bg-orange-50">
                <div className="flex items-center gap-2">
                  <MessageCircle className="text-orange-500" size={22} />
                  <span className="font-semibold text-orange-700">
                    Discuții
                  </span>
                </div>
                {selectedChannel && (
                  <div className="flex items-center gap-2">
                    <input
                      value={newThreadTitle}
                      onChange={(e) => setNewThreadTitle(e.target.value)}
                      placeholder="Titlu discuție nouă..."
                      className="px-2 py-1 rounded border border-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-400"
                    />
                    <button
                      onClick={handleCreateThread}
                      className="bg-orange-500 text-white px-3 py-1 rounded hover:bg-orange-600 flex items-center gap-1"
                    >
                      <PlusCircle size={18} />
                      Creează
                    </button>
                  </div>
                )}
              </div>
              <div className="flex flex-1 overflow-hidden">
                {/* Thread list */}
                <div className="w-1/3 bg-orange-100 p-3 overflow-y-auto border-r border-orange-200">
                  {selectedChannel ? (
                    threads.length === 0 ? (
                      <div className="text-gray-400">Nicio discuție.</div>
                    ) : (
                      <ul className="space-y-2">
                        {threads.map((th) => (
                          <li key={th.id}>
                            <button
                              onClick={() => setSelectedThread(th)}
                              className={`w-full text-left px-3 py-2 rounded-lg font-medium transition ${selectedThread?.id === th.id ? "bg-orange-400 text-white" : "hover:bg-orange-200 text-orange-800"}`}
                            >
                              {th.title}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )
                  ) : (
                    <div className="text-gray-400">Selectează un canal.</div>
                  )}
                </div>
                {/* Messages */}
                <div className="flex-1 flex flex-col bg-white p-4 overflow-y-auto">
                  {selectedThread ? (
                    <>
                      <div className="flex-1 overflow-y-auto mb-2">
                        {messages.length === 0 ? (
                          <div className="text-gray-400">Niciun mesaj.</div>
                        ) : (
                          <ul className="space-y-3">
                            {messages.map((msg) => (
                              <li
                                key={msg.id}
                                className="bg-orange-50 rounded-lg p-3 shadow-sm"
                              >
                                <div className="text-sm text-orange-800 font-semibold mb-1">
                                  {msg.user_id}
                                </div>
                                <div className="text-gray-800 whitespace-pre-line">
                                  {msg.content}
                                </div>
                                <div className="text-xs text-gray-400 mt-1">
                                  {new Date(msg.created_at).toLocaleString()}
                                </div>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <input
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          placeholder="Scrie un mesaj..."
                          className="flex-1 px-3 py-2 rounded border border-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-400"
                        />
                        <button
                          onClick={handleSendMessage}
                          className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 flex items-center gap-1"
                        >
                          <Send size={18} />
                          Trimite
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="text-gray-400 flex-1 flex items-center justify-center">
                      Selectează o discuție.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
