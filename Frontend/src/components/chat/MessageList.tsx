import { Message } from "@/types/chat";
import { FlightCard } from "./FlightCard";
import { HotelCard } from "./HotelCard";
import { ItineraryCard } from "./ItineraryCard";
import { ActivityCard } from "./ActivityCard";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, User, Bot, AlertCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useToast } from "@/hooks/use-toast";

interface MessageListProps {
  messages: Message[];
}

export function MessageList({ messages }: MessageListProps) {
  const { toast } = useToast();

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard" });
  };

  return (
    <div className="space-y-6 p-4">
      {messages.map((message) => (
        <div
          key={message.id}
          className={cn(
            "flex gap-3",
            message.role === "user" ? "justify-end" : "justify-start"
          )}
        >
          {message.role === "assistant" && (
            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
              <Bot className="h-5 w-5 text-primary-foreground" />
            </div>
          )}

          <div className={cn(
            "flex-1 max-w-3xl space-y-3",
            message.role === "user" && "max-w-xl"
          )}>
            {message.content.map((block, idx) => (
              <div key={idx}>
                {block.type === "text" && block.text && (
                  <Card className={cn(
                    message.role === "user" && "bg-primary text-primary-foreground"
                  )}>
                    <CardContent className="p-4">
                      <div className="prose prose-sm max-w-none dark:prose-invert">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {typeof block.text === "string" 
                            ? block.text 
                            : typeof block.text === "object" 
                              ? JSON.stringify(block.text, null, 2)
                              : String(block.text || "")}
                        </ReactMarkdown>
                      </div>
                      {message.role === "assistant" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="mt-2 h-7"
                          onClick={() => {
                            const textToCopy = typeof block.text === "string" 
                              ? block.text 
                              : typeof block.text === "object" 
                                ? JSON.stringify(block.text, null, 2)
                                : String(block.text || "");
                            copyToClipboard(textToCopy);
                          }}
                        >
                          <Copy className="h-3 w-3 mr-1" />
                          Copy
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                )}

                {block.type === "flights" && block.flights && (
                  <div className="grid gap-4 md:grid-cols-2">
                    {block.flights.map((flight) => (
                      <FlightCard key={flight.id} flight={flight} />
                    ))}
                  </div>
                )}

                {block.type === "hotels" && block.hotels && (
                  <div className="grid gap-4 md:grid-cols-2">
                    {block.hotels.map((hotel) => (
                      <HotelCard key={hotel.id} hotel={hotel} />
                    ))}
                  </div>
                )}

                {block.type === "itinerary" && block.itinerary && (
                  <div className="space-y-4">
                    {block.itinerary.map((day, dayIdx) => (
                      <ItineraryCard key={dayIdx} day={day} />
                    ))}
                  </div>
                )}

                {block.type === "activities" && block.activities && (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {block.activities.map((activity) => (
                      <ActivityCard key={activity.id} activity={activity} />
                    ))}
                  </div>
                )}

                {block.type === "error" && (
                  <Card className="border-destructive">
                    <CardContent className="flex items-start gap-3 p-4">
                      <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-medium text-destructive">Error</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {typeof block.text === "string" 
                            ? block.text 
                            : typeof block.text === "object" 
                              ? JSON.stringify(block.text, null, 2)
                              : String(block.text || "")}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {block.type === "info" && (
                  <Card className="border-primary">
                    <CardContent className="flex items-start gap-3 p-4">
                      <Info className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <p className="text-sm">
                        {typeof block.text === "string" 
                          ? block.text 
                          : typeof block.text === "object" 
                            ? JSON.stringify(block.text, null, 2)
                            : String(block.text || "")}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            ))}

            {message.streaming && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <div className="flex gap-1">
                  <div className="h-2 w-2 rounded-full bg-current animate-pulse" />
                  <div className="h-2 w-2 rounded-full bg-current animate-pulse delay-100" />
                  <div className="h-2 w-2 rounded-full bg-current animate-pulse delay-200" />
                </div>
                <span className="text-sm">Thinking...</span>
              </div>
            )}
          </div>

          {message.role === "user" && (
            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
              <User className="h-5 w-5" />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
