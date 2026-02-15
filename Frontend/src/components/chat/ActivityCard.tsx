import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Activity } from "@/types/chat";
import { MapPin, Clock, Ticket } from "lucide-react";

interface ActivityCardProps {
  activity: Activity;
}

export function ActivityCard({ activity }: ActivityCardProps) {
  return (
    <Card className="min-h-[180px]">
      <CardHeader>
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg">{activity.name}</CardTitle>
          <Badge>{activity.category}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {activity.description && (
          <p className="text-sm text-muted-foreground">{activity.description}</p>
        )}
        <div className="space-y-2 text-sm">
          {activity.openingHours && (
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>{activity.openingHours}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>Est. time: {activity.estimatedTime}</span>
          </div>
          {activity.ticketInfo && (
            <div className="flex items-center gap-2">
              <Ticket className="h-4 w-4 text-muted-foreground" />
              <span>{activity.ticketInfo}</span>
            </div>
          )}
        </div>
        {activity.mapLink && (
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => window.open(activity.mapLink, "_blank")}
          >
            <MapPin className="h-4 w-4 mr-2" />
            View on Map
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
