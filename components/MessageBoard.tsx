"use client";

import { useState } from "react";
import Button from "@/components/Button";
import Input from "@/components/Input";

interface Thread {
  id: string;
  title: string;
  author: string;
  content: string;
  replies: number;
  upvotes: number;
  createdAt: string;
  isPinned?: boolean;
}

interface Reply {
  id: string;
  threadId: string;
  author: string;
  content: string;
  upvotes: number;
  createdAt: string;
}

const mockThreads: Thread[] = [
  {
    id: "1",
    title: "New pattern discovery: Flashloan + Oracle manipulation",
    author: "WhiteRabbit",
    content: "Found an interesting combination attack vector involving flashloans and oracle price manipulation...",
    replies: 23,
    upvotes: 45,
    createdAt: "2 hours ago",
    isPinned: true,
  },
  {
    id: "2",
    title: "SSV Network DoS vulnerability discussion",
    author: "v0id_injector",
    content: "Discussion around the recent DoS finding in SSV Network's operator system...",
    replies: 12,
    upvotes: 34,
    createdAt: "5 hours ago",
  },
];

const mockReplies: Record<string, Reply[]> = {
  "1": [
    {
      id: "101",
      threadId: "1",
      author: "BigHoss",
      content: "Interesting find! Have you tested this on other protocols?",
      upvotes: 5,
      createdAt: "1 hour ago",
    },
    {
      id: "102",
      threadId: "1",
      author: "Yuji",
      content: "Yes, I've seen similar patterns in a few other DeFi protocols.",
      upvotes: 3,
      createdAt: "45 minutes ago",
    },
  ],
};

export default function MessageBoard() {
  const [threads] = useState<Thread[]>(mockThreads);
  const [expandedThread, setExpandedThread] = useState<string | null>(null);
  const [newThreadTitle, setNewThreadTitle] = useState("");
  const [newThreadContent, setNewThreadContent] = useState("");
  const [showNewThreadForm, setShowNewThreadForm] = useState(false);

  const toggleThread = (threadId: string) => {
    setExpandedThread(expandedThread === threadId ? null : threadId);
  };

  const handleSubmitThread = () => {
    if (newThreadTitle && newThreadContent) {
      // In a real app, this would submit to an API
      console.log("Creating thread:", { title: newThreadTitle, content: newThreadContent });
      setNewThreadTitle("");
      setNewThreadContent("");
      setShowNewThreadForm(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* New Thread Button */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">World Board</h2>
        <Button onClick={() => setShowNewThreadForm(!showNewThreadForm)}>
          {showNewThreadForm ? "Cancel" : "New Thread"}
        </Button>
      </div>

      {/* New Thread Form */}
      {showNewThreadForm && (
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Create New Thread</h3>
          <div className="space-y-4">
            <Input
              label="Title"
              value={newThreadTitle}
              onChange={(e) => setNewThreadTitle(e.target.value)}
              placeholder="Thread title"
            />
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Content</label>
              <textarea
                value={newThreadContent}
                onChange={(e) => setNewThreadContent(e.target.value)}
                rows={4}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="What would you like to discuss?"
              />
            </div>
            <div className="flex justify-end">
              <Button onClick={handleSubmitThread}>Post Thread</Button>
            </div>
          </div>
        </div>
      )}

      {/* Threads List */}
      <div className="space-y-4">
        {threads.map((thread) => (
          <div
            key={thread.id}
            className="bg-gray-800 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors"
          >
            {/* Thread Header */}
            <div 
              className="p-6 cursor-pointer"
              onClick={() => toggleThread(thread.id)}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {thread.isPinned && (
                      <span className="bg-yellow-900/50 text-yellow-400 text-xs px-2 py-1 rounded">
                        Pinned
                      </span>
                    )}
                    <h3 className="text-lg font-semibold text-white">{thread.title}</h3>
                  </div>
                  <p className="text-gray-400 text-sm mb-3 line-clamp-2">
                    {thread.content}
                  </p>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>by @{thread.author}</span>
                    <span>{thread.createdAt}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-400 ml-4">
                  <span>↑ {thread.upvotes}</span>
                  <span>{thread.replies} replies</span>
                </div>
              </div>
            </div>

            {/* Expanded Thread Content */}
            {expandedThread === thread.id && (
              <div className="px-6 pb-6 border-t border-gray-700">
                <div className="py-4">
                  <p className="text-gray-300">{thread.content}</p>
                </div>

                {/* Replies */}
                <div className="space-y-4 mt-6">
                  <h4 className="text-md font-semibold text-white">Replies ({thread.replies})</h4>
                  
                  {/* Reply Form */}
                  <div className="bg-gray-700/50 rounded-lg p-4">
                    <textarea
                      placeholder="Write a reply..."
                      rows={2}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent mb-3"
                    />
                    <div className="flex justify-end">
                      <Button size="sm">Post Reply</Button>
                    </div>
                  </div>

                  {/* Existing Replies */}
                  {mockReplies[thread.id]?.map((reply) => (
                    <div key={reply.id} className="bg-gray-700/30 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-medium text-white">@{reply.author}</span>
                        <span className="text-xs text-gray-500">{reply.createdAt}</span>
                      </div>
                      <p className="text-gray-300 text-sm">{reply.content}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <button className="hover:text-gray-300">↑ {reply.upvotes}</button>
                        <button className="hover:text-gray-300">Reply</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}