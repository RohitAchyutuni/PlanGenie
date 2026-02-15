import { useState, useEffect, useMemo, useCallback } from "react";
import { Outlet, useNavigate, useParams } from "react-router-dom";
import { AppNav } from "@/components/layout/AppNav";
import { ChatSidebar } from "@/components/sidebar/ChatSidebar";
import { useChatThreads } from "@/hooks/useChatThreads";
import { ChatThread } from "@/types/chat";
import { getCurrentUser } from "@/lib/authApi";
import { useToast } from "@/hooks/use-toast";

export default function AppLayout() {
  const navigate = useNavigate();
  const { threadId } = useParams();
  const { threads, createThread, deleteThread, duplicateThread, archiveThread, updateThreadTitle } = useChatThreads();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { toast } = useToast();

  // Check authentication
  useEffect(() => {
    const user = getCurrentUser();
    const isAuthenticated = localStorage.getItem("isAuthenticated") === "true";
    
    if (!user && !isAuthenticated) {
      // Allow demo mode (isAuthenticated but no user)
      // But if neither exists, redirect to login
      // For now, allow access (demo mode support)
    }
  }, [navigate]);

  // Check if there's already an empty thread (for UI display purposes) - memoized to prevent recalculation
  const hasEmptyThread = useMemo(() => {
    return threads.some(t => t.messages.length === 0);
  }, [threads]);

  const handleNewChat = useCallback(async () => {
    console.log("🔄 handleNewChat called");
    try {
      // Check if user is logged in
      const user = getCurrentUser();
      console.log("👤 User:", user ? "logged in" : "not logged in");
      if (!user) {
        toast({
          title: "Please log in",
          description: "You need to be logged in to create a chat.",
          variant: "destructive",
        });
        navigate("/login");
        return;
      }

      // Always create a new thread when user clicks "New Chat"
      console.log("Creating new chat thread...");
      const newThread = await createThread();
      console.log("New thread created:", newThread);
      
      if (newThread && newThread.id) {
        // Use requestAnimationFrame to ensure state updates are flushed before navigation
        requestAnimationFrame(() => {
          navigate(`/app/chat/${newThread.id}`);
        });
      } else {
        throw new Error("Failed to create chat: Invalid response from server");
      }
    } catch (error) {
      // Error is already handled by createThread with a toast notification
      // Just log for debugging
      console.error("Failed to create new chat:", error);
    }
  }, [createThread, navigate, toast]);

  const handleThreadSelect = useCallback((id: string) => {
    navigate(`/app/chat/${id}`);
  }, [navigate]);

  const handleRenameThread = useCallback(async (id: string, newTitle: string) => {
    await updateThreadTitle(id, newTitle);
  }, [updateThreadTitle]);

  const handleDeleteThread = useCallback(async (id: string) => {
    const wasActiveChat = threadId === id;
    await deleteThread(id);
    // If we deleted the currently active chat, navigate away
    if (wasActiveChat) {
      navigate("/app");
    }
  }, [deleteThread, navigate, threadId]);

  const handleToggleSidebar = useCallback(() => {
    setSidebarOpen(prev => !prev);
  }, []);

  return (
    <div className="flex flex-col h-screen w-full">
      <AppNav onNewChat={handleNewChat} onToggleSidebar={handleToggleSidebar} hasEmptyThread={hasEmptyThread} />
      <div className="flex flex-1 overflow-hidden w-full">
        <div 
          className={`${
            sidebarOpen ? "w-80" : "w-0"
          } transition-all duration-300 ease-in-out flex-shrink-0 overflow-hidden border-r`}
        >
          <ChatSidebar
            threads={threads}
            activeThreadId={threadId}
            onThreadSelect={handleThreadSelect}
            onNewThread={handleNewChat}
            onDeleteThread={handleDeleteThread}
            onDuplicateThread={duplicateThread}
            onArchiveThread={archiveThread}
            onRenameThread={handleRenameThread}
            hasEmptyThread={hasEmptyThread}
          />
        </div>
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
