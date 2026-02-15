import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, StopCircle, RotateCcw } from "lucide-react";

interface ComposerProps {
  onSend: (message: string, meta?: any) => void;
  onStop?: () => void;
  onRegenerate?: () => void;
  isStreaming?: boolean;
}

export function Composer({ onSend, onStop, onRegenerate, isStreaming }: ComposerProps) {
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (!input.trim()) return;
    onSend(input.trim());
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t bg-background p-4">
      <div className="flex gap-2">
        <Textarea
          placeholder="Ask me to plan your trip... (Enter to send, Shift+Enter for new line)"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          className="min-h-[60px] resize-none flex-1"
        />

        {isStreaming ? (
          <Button
            size="icon"
            variant="destructive"
            onClick={onStop}
            className="h-[60px] w-[60px]"
          >
            <StopCircle className="h-5 w-5" />
          </Button>
        ) : (
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!input.trim()}
            className="h-[60px] w-[60px] bg-primary hover:bg-primary/90 transition-all"
          >
            <Send className="h-5 w-5" />
          </Button>
        )}
      </div>
    </div>
  );
}
