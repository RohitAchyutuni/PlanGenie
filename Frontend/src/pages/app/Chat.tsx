import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { MessageList } from "@/components/chat/MessageList";
import { Composer } from "@/components/chat/Composer";
import { TripPlanSidebar } from "@/components/chat/TripPlanSidebar";
import { ChainOfThought } from "@/components/chat/ChainOfThought";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trash2, Edit2, Check } from "lucide-react";
import { ChatThread, Message, ContentBlock, Flight, Hotel, ItineraryDay } from "@/types/chat";
import { storage } from "@/lib/storage";
import { useChatThreads } from "@/hooks/useChatThreads";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { usePlanStore } from "@/hooks/usePlanStore";
import { openPlanStream, fetchPlan } from "@/lib/planStream";
import { mapPlanJsonToUi } from "@/lib/planAdapter";
import { generateChatTitle, updateChatTitle, getUserChats } from "@/lib/chatApi";

interface ThoughtStep {
  id: string;
  text: string;
  completed: boolean;
  timestamp: number;
}

export default function Chat() {
  const { threadId } = useParams();
  const navigate = useNavigate();
  const location = useLocation(); // Use location to detect route changes
  const { saveThread, deleteThread, threads } = useChatThreads();
  const { toast } = useToast();
  const [thread, setThread] = useState<ChatThread | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [progressSteps, setProgressSteps] = useState<ThoughtStep[]>([]);
  const streamCleanupRef = useRef<(() => void) | null>(null);
  const planFetchedRef = useRef<string | null>(null); // Track which threadId we've fetched plan for
  const previousThreadIdRef = useRef<string | undefined>(undefined); // Track previous threadId to detect changes
  const planExtractedRef = useRef<string | null>(null); // Track which threadId we've extracted plan for
  const threadsLoadedRef = useRef<boolean>(false); // Track if threads have been loaded at least once
  
  // Use the plan store hook - extract only the setters we need to avoid dependency issues
  const planStore = usePlanStore();
  const { setFlights, setHotels, setItineraryDays, setSummary, resetPlan } = planStore;

  // Memoize thread lookup to avoid creating new references
  // Use threadsIds string to detect when thread IDs change, and threadsLength to detect when count changes
  const threadsIds = useMemo(() => threads.map(t => t.id).join(','), [threads]);
  const threadsLength = threads.length;
  const threadById = useMemo(() => {
    if (!threadId) return null;
    // Try localStorage first
    const fromStorage = storage.getThread(threadId);
    if (fromStorage) return fromStorage;
    // Then try threads array - we need threads here for the find operation
    return threads.find(t => t.id === threadId) || null;
  }, [threadId, threadsIds, threadsLength, threads]);

  // Memoize extractPlanData to prevent recreating on every render
  const extractPlanData = useCallback((thread: ChatThread, chatMemory?: any) => {
    // Extract plan data from messages (primary source) or chat_memory.plan (fallback)
    // This ensures persistence even if messages don't have content blocks
    const flights: Flight[] = [];
    const hotels: Hotel[] = [];
    const itinerary: ItineraryDay[] = [];
    let summary = "";

    // First, try to extract from messages (content blocks)
    thread.messages.forEach((msg) => {
      if (msg.role === "assistant") {
        msg.content.forEach((block) => {
          if (block.type === "flights" && block.flights && Array.isArray(block.flights)) {
            // Collect all flights (avoid duplicates by ID)
            block.flights.forEach((flight: Flight) => {
              if (!flights.find(f => f.id === flight.id)) {
                flights.push(flight);
              }
            });
          } else if (block.type === "hotels" && block.hotels && Array.isArray(block.hotels)) {
            // Collect all hotels (avoid duplicates by ID)
            block.hotels.forEach((hotel: Hotel) => {
              if (!hotels.find(h => h.id === hotel.id)) {
                hotels.push(hotel);
              }
            });
          } else if (block.type === "itinerary" && block.itinerary && Array.isArray(block.itinerary)) {
            // Collect all itinerary days (avoid duplicates by date)
            block.itinerary.forEach((day: ItineraryDay) => {
              if (!itinerary.find(d => d.date === day.date)) {
                itinerary.push(day);
              }
            });
          } else if (block.type === "text" && block.text) {
            // Use the last text block as summary
            summary = typeof block.text === "string" 
              ? block.text 
              : typeof block.text === "object" 
                ? JSON.stringify(block.text)
                : String(block.text || "");
          }
        });
      }
    });

    // If no data found in messages, try chat_memory.plan as fallback
    if (flights.length === 0 && hotels.length === 0 && itinerary.length === 0 && chatMemory?.plan) {
      console.log("📦 No plan data in messages, trying chat_memory.plan as fallback");
      const plan = chatMemory.plan;
      console.log("📦 chat_memory.plan structure:", {
        hasFlights: !!plan.flights,
        flightsType: Array.isArray(plan.flights) ? `array[${plan.flights.length}]` : typeof plan.flights,
        hasHotels: !!plan.hotels,
        hotelsType: Array.isArray(plan.hotels) ? `array[${plan.hotels.length}]` : typeof plan.hotels,
        hasItinerary: !!plan.itinerary,
        itineraryDaysType: plan.itinerary?.days ? (Array.isArray(plan.itinerary.days) ? `array[${plan.itinerary.days.length}]` : typeof plan.itinerary.days) : 'none'
      });
      
      if (plan.flights && Array.isArray(plan.flights)) {
        console.log("📦 Loading flights from chat_memory.plan:", plan.flights.length);
        flights.push(...plan.flights);
      } else {
        console.warn("📦 No flights found in chat_memory.plan or not an array:", plan.flights);
      }
      if (plan.hotels && Array.isArray(plan.hotels)) {
        hotels.push(...plan.hotels);
      }
      if (plan.itinerary?.days && Array.isArray(plan.itinerary.days)) {
        itinerary.push(...plan.itinerary.days);
      }
      if (plan.summary) {
        summary = plan.summary;
      }
    }

    // Use adapter to normalize and update store
    const normalized = mapPlanJsonToUi({ flights, hotels, itinerary });
    
    console.log("📦 Extracting plan data:", {
      threadId: thread.id,
      messagesCount: thread.messages.length,
      flightsCount: normalized.flights.length,
      hotelsCount: normalized.hotels.length,
      itineraryCount: normalized.itineraryDays.length,
      hasSummary: !!summary,
      source: flights.length > 0 || hotels.length > 0 || itinerary.length > 0 ? "messages" : "none"
    });
    
    // Always update store with extracted data (this is the source of truth)
    setFlights(normalized.flights);
    setHotels(normalized.hotels);
    setItineraryDays(normalized.itineraryDays);
    if (summary) {
      setSummary(summary);
    }
    
    console.log("✅ Plan store updated from chat messages");
  }, [setFlights, setHotels, setItineraryDays, setSummary]);

  // Main effect: Load thread ONLY when threadId changes (not when threads array changes)
  useEffect(() => {
    const previousThreadId = previousThreadIdRef.current;
    const threadIdChanged = previousThreadId !== threadId;
    
    // Update the ref for next time
    previousThreadIdRef.current = threadId;
    
    // Cleanup stream on threadId change
    if (threadIdChanged && streamCleanupRef.current) {
      streamCleanupRef.current();
      streamCleanupRef.current = null;
    }
    
    if (!threadId) {
      setThread(null);
      resetPlan();
      planFetchedRef.current = null;
      planExtractedRef.current = null;
      return;
    }
    
    // Reset state when threadId changes
    if (threadIdChanged) {
      console.log("🔄 ThreadId changed from", previousThreadId, "to", threadId);
      setThread(null);
      planFetchedRef.current = null;
      planExtractedRef.current = null;
    }
    
    // Use memoized thread lookup
    const loaded = threadById;
    
    if (loaded) {
      console.log("✅ Thread loaded successfully:", loaded.title);
      setThread(loaded);
      setEditTitle(loaded.title);
      
      // Extract plan data ONLY if we haven't extracted for this threadId yet
      // or if thread messages/updatedAt changed (tracked separately)
      const chatMemory = (loaded as any).chat_memory || loaded.meta?.chat_memory;
      const extractionKey = `${threadId}-${loaded.messages.length}-${loaded.updatedAt}`;
      
      if (planExtractedRef.current !== extractionKey) {
        planExtractedRef.current = extractionKey;
        console.log("🔄 Loading thread, extracting plan data from messages...");
        extractPlanData(loaded, chatMemory);
      }
      
      // Fetch plan from backend ONLY if we haven't fetched it for this threadId yet
      if (planFetchedRef.current !== threadId) {
        planFetchedRef.current = threadId;
        console.log("📡 Fetching plan from backend for thread:", threadId);
        
        fetchPlan(threadId, {
          onFlights: (flights) => {
            if (flights && flights.length > 0) {
              console.log("📥 Updating flights from backend:", flights.length);
              setFlights(flights);
            }
          },
          onHotels: (hotels) => {
            if (hotels && hotels.length > 0) {
              console.log("📥 Updating hotels from backend:", hotels.length);
              setHotels(hotels);
            }
          },
          onItinerary: (itinerary) => {
            if (itinerary && itinerary.length > 0) {
              console.log("📥 Updating itinerary from backend:", itinerary.length);
              setItineraryDays(itinerary);
            }
          },
          onSummary: (summary) => {
            if (summary) {
              setSummary(summary);
            }
          },
          onError: (error) => {
            console.warn("⚠️ Failed to fetch plan from backend (using message data):", error);
          }
        }).catch(() => {
          // Ignore errors - fallback to message extraction
        });
      }
    } else {
      // Thread not found - only try to fetch from backend if threads have been loaded
      if (!threadsLoadedRef.current && threads.length === 0) {
        console.log("⏳ Threads array is empty, waiting for threads to load...");
        return;
      }
      
      threadsLoadedRef.current = true;
      
      // Thread not found - try to fetch from backend
      console.log("🔄 Thread not found, trying to fetch from backend...");
      getUserChats().then((dbChats) => {
        const dbChat = dbChats.find(c => c.id === threadId);
        if (dbChat) {
          console.log("✅ Found thread in backend, converting and loading...");
          const chatMemory = dbChat.chat_memory || {};
          const messages = chatMemory.messages || [];
          
          const frontendMessages = messages.map((msg: any) => {
            const content: any[] = [];
            if (msg.role === "user") {
              if (typeof msg.content === "string") {
                content.push({ type: "text", text: msg.content });
              } else if (Array.isArray(msg.content)) {
                const normalizedBlocks = msg.content.map((block: any) => {
                  if (block.type === "text" && block.text !== undefined) {
                    return {
                      ...block,
                      text: typeof block.text === "string" 
                        ? block.text 
                        : typeof block.text === "object" 
                          ? JSON.stringify(block.text)
                          : String(block.text || "")
                    };
                  }
                  return block;
                });
                content.push(...normalizedBlocks);
              } else {
                content.push({ type: "text", text: String(msg.content || "") });
              }
            } else if (msg.role === "assistant") {
              if (typeof msg.content === "string") {
                content.push({ type: "text", text: msg.content });
              } else if (Array.isArray(msg.content)) {
                const normalizedBlocks = msg.content.map((block: any) => {
                  if (block.type === "text" && block.text !== undefined) {
                    return {
                      ...block,
                      text: typeof block.text === "string" 
                        ? block.text 
                        : typeof block.text === "object" 
                          ? JSON.stringify(block.text)
                          : String(block.text || "")
                    };
                  }
                  return block;
                });
                content.push(...normalizedBlocks);
              }
            }
            
            return {
              id: msg.id || crypto.randomUUID(),
              role: msg.role,
              createdAt: msg.timestamp || msg.createdAt || new Date().toISOString(),
              content: content.length > 0 ? content : [{ type: "text", text: "" }]
            };
          });
          
          const convertedThread: ChatThread = {
            id: dbChat.id,
            title: dbChat.title,
            createdAt: dbChat.created_at,
            updatedAt: dbChat.updated_at || dbChat.created_at,
            messages: frontendMessages,
            meta: chatMemory.trip_constraints || {},
            archived: false,
            chat_memory: chatMemory,
          } as ChatThread & { chat_memory?: any };
          
          storage.saveThread(convertedThread);
          setThread(convertedThread);
          setEditTitle(convertedThread.title);
          
          const extractionKey = `${threadId}-${convertedThread.messages.length}-${convertedThread.updatedAt}`;
          planExtractedRef.current = extractionKey;
          extractPlanData(convertedThread, chatMemory);
        } else {
          console.error("❌ Thread not found in backend either");
          setThread(null);
          resetPlan();
          planFetchedRef.current = null;
          planExtractedRef.current = null;
        }
      }).catch((error) => {
        console.error("Failed to fetch thread from backend:", error);
        setThread(null);
        resetPlan();
        planFetchedRef.current = null;
        planExtractedRef.current = null;
      });
    }
    
    // Cleanup on unmount
    return () => {
      if (streamCleanupRef.current) {
        streamCleanupRef.current();
        streamCleanupRef.current = null;
      }
    };
    // Depend on threadId, threadById (memoized), extractPlanData (memoized), and resetPlan (stable)
    // Use threadById instead of threads to avoid recreating when threads array reference changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threadId, threadById, extractPlanData, resetPlan, setFlights, setHotels, setItineraryDays, setSummary]);
  
  // Track when threads are loaded - use ref to track previous length
  const prevThreadsLengthRef = useRef(threads.length);
  useEffect(() => {
    if (threads.length > 0 && prevThreadsLengthRef.current === 0) {
      threadsLoadedRef.current = true;
    }
    prevThreadsLengthRef.current = threads.length;
  }, [threads.length]);
  
  // Check if thread was deleted (only when threads array length changes, not content)
  const threadsLengthRef = useRef(threads.length);
  const threadIdsRef = useRef<string>(threads.map(t => t.id).join(','));
  useEffect(() => {
    const currentThreadIds = threads.map(t => t.id).join(',');
    const lengthChanged = threads.length !== threadsLengthRef.current;
    const idsChanged = currentThreadIds !== threadIdsRef.current;
    
    if (lengthChanged || idsChanged) {
      threadsLengthRef.current = threads.length;
      threadIdsRef.current = currentThreadIds;
      
      if (threadId && threads.length > 0) {
        const threadExists = threads.some(t => t.id === threadId);
        if (!threadExists) {
          setThread(null);
          resetPlan();
          planFetchedRef.current = null;
          planExtractedRef.current = null;
          navigate("/app");
        }
      }
    }
  }, [threads.length, threadId, navigate, resetPlan, threads]);


  const handleSend = async (text: string) => {
    if (!thread || !threadId) return;

    // Clean up any existing stream BEFORE opening a new one
    if (streamCleanupRef.current) {
      console.log("[Chat] Cleaning up previous stream before starting new one");
      streamCleanupRef.current();
      streamCleanupRef.current = null;
      // Small delay to ensure cleanup completes before starting new stream
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    // IMMEDIATELY show user message - don't wait for anything
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      createdAt: new Date().toISOString(),
      content: [{ type: "text", text }]
    };

    const updatedThread = {
      ...thread,
      messages: [...thread.messages, userMessage],
      updatedAt: new Date().toISOString()
    };
    setThread(updatedThread);
    saveThread(updatedThread);

    // Generate title automatically if this is the first message (non-blocking)
    if (thread.messages.length === 0) {
      generateChatTitle(text.trim()).then((generatedTitle) => {
        const titledThread = {
          ...updatedThread,
          title: generatedTitle,
          updatedAt: new Date().toISOString()
        };
        setThread(titledThread);
        saveThread(titledThread);
        // Update title in backend
        updateChatTitle(threadId, generatedTitle).catch((error) => {
          console.warn("Failed to update title in backend:", error);
        });
      }).catch((error) => {
        console.warn("Failed to generate chat title:", error);
      });
    }

    // Reset plan data to show placeholders
    resetPlan();
    setIsStreaming(true);
    
    // Reset progress steps for new message
    setProgressSteps([]);

    // Create initial assistant message for streaming
    const assistantMessageId = crypto.randomUUID();
    const assistantMessage: Message = {
      id: assistantMessageId,
      role: "assistant",
      createdAt: new Date().toISOString(),
      content: [{ type: "text", text: "" }],
      streaming: true
    };

    const streamingThread = {
      ...updatedThread,
      messages: [...updatedThread.messages, assistantMessage],
      updatedAt: new Date().toISOString()
    };
    setThread(streamingThread);
    saveThread(streamingThread);

    // Open SSE stream
    const cleanup = openPlanStream({
      threadId,
      message: text,
      callbacks: {
        onOpen: () => {
          setIsStreaming(true);
        },
        onTextChunk: (chunk: string) => {
          // Ensure chunk is always a string
          const textChunk = typeof chunk === "string" 
            ? chunk 
            : typeof chunk === "object" 
              ? JSON.stringify(chunk)
              : String(chunk || "");
          
          // Check if this is a progress update
          // Progress updates are typically short messages that indicate what the system is doing
          const progressKeywords = ["searching", "finding", "building", "planning", "finalizing", "got it", "let me"];
          const textLower = textChunk.trim().toLowerCase();
          const isProgressUpdate = textChunk.trim().length > 0 && 
            (textChunk.endsWith("...") || 
             textChunk.length < 200 ||
             progressKeywords.some(keyword => textLower.includes(keyword)));
          
          if (isProgressUpdate) {
            console.log("[Progress] Detected progress update:", textChunk.trim());
            // Add progress step to Chain of Thought only (don't show in message bubble)
            setProgressSteps((prev) => {
              // Check if this step already exists (avoid duplicates)
              const existingIndex = prev.findIndex(step => step.text.trim() === textChunk.trim());
              if (existingIndex >= 0) {
                // Update existing step instead of adding duplicate
                const updated = [...prev];
                updated[existingIndex] = { ...updated[existingIndex], completed: false };
                return updated;
              }
              
              // Mark previous steps as completed
              const updated = prev.map(step => ({ ...step, completed: true }));
              
              // Add new step
              const newStep: ThoughtStep = {
                id: crypto.randomUUID(),
                text: textChunk.trim(),
                completed: false,
                timestamp: Date.now()
              };
              
              return [...updated, newStep];
            });
            
            // Don't update message text for progress updates - only show in Chain of Thought
            return;
          }
          
          // For non-progress chunks (actual content), update the message
          setThread((prev) => {
            if (!prev) return prev;
            const updated = { ...prev };
            const msgIndex = updated.messages.findIndex((m) => m.id === assistantMessageId);
            if (msgIndex >= 0) {
              const msg = updated.messages[msgIndex];
              const textBlock = msg.content.find((b) => b.type === "text");
              if (textBlock) {
                // Ensure existing text is also a string before appending
                const existingText = typeof textBlock.text === "string" 
                  ? textBlock.text 
                  : typeof textBlock.text === "object" 
                    ? JSON.stringify(textBlock.text)
                    : String(textBlock.text || "");
                textBlock.text = existingText + textChunk;
              } else {
                msg.content.push({ type: "text", text: textChunk });
              }
              updated.messages = [...updated.messages];
              updated.updatedAt = new Date().toISOString();
              saveThread(updated);
            }
            return updated;
          });
        },
        onFlights: (flights: Flight[]) => {
          console.log("onFlights callback called with:", flights);
          setFlights(flights);
          console.log("Plan store flights after set:", flights);
          
          // Mark flight-related progress steps as completed
          setProgressSteps((prev) => 
            prev.map(step => ({
              ...step,
              completed: step.text.toLowerCase().includes("flight") || step.completed
            }))
          );
          
          // Also add to message content for persistence
          setThread((prev) => {
            if (!prev) return prev;
            const updated = { ...prev };
            const msgIndex = updated.messages.findIndex((m) => m.id === assistantMessageId);
            if (msgIndex >= 0) {
              const msg = updated.messages[msgIndex];
              const existingBlock = msg.content.find((b) => b.type === "flights");
              if (existingBlock) {
                existingBlock.flights = flights;
              } else {
                msg.content.push({ type: "flights", flights });
              }
              updated.messages = [...updated.messages];
              updated.updatedAt = new Date().toISOString();
              saveThread(updated);
            }
            return updated;
          });
        },
        onHotels: (hotels: Hotel[]) => {
          setHotels(hotels);
          
          // Mark hotel-related progress steps as completed
          setProgressSteps((prev) => 
            prev.map(step => ({
              ...step,
              completed: step.text.toLowerCase().includes("hotel") || step.completed
            }))
          );
          
          setThread((prev) => {
            if (!prev) return prev;
            const updated = { ...prev };
            const msgIndex = updated.messages.findIndex((m) => m.id === assistantMessageId);
            if (msgIndex >= 0) {
              const msg = updated.messages[msgIndex];
              const existingBlock = msg.content.find((b) => b.type === "hotels");
              if (existingBlock) {
                existingBlock.hotels = hotels;
              } else {
                msg.content.push({ type: "hotels", hotels });
              }
              updated.messages = [...updated.messages];
              updated.updatedAt = new Date().toISOString();
              saveThread(updated);
            }
            return updated;
          });
        },
        onItinerary: (itineraryDays: ItineraryDay[]) => {
          setItineraryDays(itineraryDays);
          
          // Mark itinerary-related progress steps as completed
          setProgressSteps((prev) => 
            prev.map(step => ({
              ...step,
              completed: step.text.toLowerCase().includes("itinerary") || 
                        step.text.toLowerCase().includes("plan") || 
                        step.text.toLowerCase().includes("schedule") ||
                        step.completed
            }))
          );
          
          setThread((prev) => {
            if (!prev) return prev;
            const updated = { ...prev };
            const msgIndex = updated.messages.findIndex((m) => m.id === assistantMessageId);
            if (msgIndex >= 0) {
              const msg = updated.messages[msgIndex];
              const existingBlock = msg.content.find((b) => b.type === "itinerary");
              if (existingBlock) {
                existingBlock.itinerary = itineraryDays;
              } else {
                msg.content.push({ type: "itinerary", itinerary: itineraryDays });
              }
              updated.messages = [...updated.messages];
              updated.updatedAt = new Date().toISOString();
              saveThread(updated);
            }
            return updated;
          });
        },
        onSummary: (summary: string) => {
          setSummary(summary);
          
          // Mark all progress steps as completed when summary is received
          setProgressSteps((prev) => 
            prev.map(step => ({ ...step, completed: true }))
          );
        },
        onError: (error: Error) => {
          console.error("Stream error:", error);
          toast({
            title: "Stream error",
            description: error.message,
            variant: "destructive"
          });
          setIsStreaming(false);
        },
        onClose: () => {
          console.log("[Chat] Stream closed");
          setIsStreaming(false);
        },
        onFinal: () => {
          // Mark message as no longer streaming
          setThread((prev) => {
            if (!prev) return prev;
            const updated = { ...prev };
            const msgIndex = updated.messages.findIndex((m) => m.id === assistantMessageId);
            if (msgIndex >= 0) {
              updated.messages[msgIndex] = {
                ...updated.messages[msgIndex],
                streaming: false
              };
              updated.updatedAt = new Date().toISOString();
              saveThread(updated);
            }
            return updated;
          });
          
          // Mark all progress steps as completed
          setProgressSteps((prev) => 
            prev.map(step => ({ ...step, completed: true }))
          );
          
          setIsStreaming(false);
          streamCleanupRef.current = null;
        }
      }
    });

    streamCleanupRef.current = cleanup;
  };

  const handleSaveTitle = async () => {
    if (!thread || !editTitle.trim()) return;
    const updated = { ...thread, title: editTitle.trim(), updatedAt: new Date().toISOString() };
    setThread(updated);
    saveThread(updated);
    
    // Update title in backend
    try {
      await updateChatTitle(thread.id, editTitle.trim());
    } catch (error) {
      console.warn("Failed to update title in backend:", error);
    }
    
    setIsEditing(false);
    toast({ title: "Title updated" });
  };

  const handleDelete = async () => {
    if (!threadId) return;
    try {
      // Delete thread - this will update the threads state in the hook (optimistic update)
      // The state update happens synchronously, so the sidebar should update immediately
      await deleteThread(threadId);
      // Use requestAnimationFrame to ensure the state update is rendered before navigating
      // This gives React a chance to re-render the sidebar with the updated threads list
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            resolve();
          });
        });
      });
      // Navigate away after successful deletion
      // The sidebar will have already updated due to the optimistic state update
      navigate("/app");
    } catch (error) {
      // Error is already handled in deleteThread with toast
      console.error("Failed to delete chat:", error);
    }
  };

  if (!thread) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Select a chat or create a new one</p>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* Main Chat Area */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Header */}
        <div className="border-b p-4 flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {isEditing ? (
              <>
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSaveTitle()}
                  className="max-w-md"
                  autoFocus
                />
                <Button size="icon" variant="ghost" onClick={handleSaveTitle}>
                  <Check className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <>
                <h1 className="text-xl font-semibold truncate">{thread.title}</h1>
                <Button size="icon" variant="ghost" onClick={() => setIsEditing(true)}>
                  <Edit2 className="h-4 w-4" />
                </Button>
              </>
            )}
            <p className="text-sm text-muted-foreground ml-4 whitespace-nowrap">
              Updated {format(new Date(thread.updatedAt), "MMM d, h:mm a")}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={handleDelete}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1">
          {thread.messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <h2 className="text-2xl font-semibold mb-2">Start planning your trip</h2>
              <p className="text-sm text-muted-foreground/60 mb-6">
                Tell me where you want to go, and I'll help you find flights, hotels, and activities.
              </p>
            </div>
          ) : (
            <div className="space-y-4 p-4">
              {/* Chain of Thought Progress */}
              {isStreaming && progressSteps.length > 0 && (
                <ChainOfThought steps={progressSteps} isActive={isStreaming} />
              )}
              <MessageList messages={thread.messages} />
            </div>
          )}
        </ScrollArea>

        {/* Composer */}
        <Composer
          onSend={handleSend}
          isStreaming={isStreaming}
          onStop={() => {
            console.log("🛑 Stop button clicked - interrupting stream");
            if (streamCleanupRef.current) {
              streamCleanupRef.current();
              streamCleanupRef.current = null;
            }
            setIsStreaming(false);
            
            // Mark the current assistant message as no longer streaming
            setThread((prev) => {
              if (!prev) return prev;
              const updated = { ...prev };
              const msgIndex = updated.messages.findIndex((m) => m.streaming === true);
              if (msgIndex >= 0) {
                updated.messages[msgIndex] = {
                  ...updated.messages[msgIndex],
                  streaming: false
                };
                updated.updatedAt = new Date().toISOString();
                saveThread(updated);
              }
              return updated;
            });
            
            // Mark all progress steps as completed
            setProgressSteps((prev) => 
              prev.map(step => ({ ...step, completed: true }))
            );
          }}
        />
      </div>

      {/* Plan Sidebar */}
      <div className="w-96 hidden lg:block h-full overflow-hidden">
        <TripPlanSidebar
          flights={planStore.flights}
          hotels={planStore.hotels}
          itinerary={planStore.itineraryDays}
          isLoading={isStreaming}
        />
      </div>
    </div>
  );
}
