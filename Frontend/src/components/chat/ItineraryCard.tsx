import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ItineraryDay } from "@/types/chat";
import { Calendar, Clock, MapPin } from "lucide-react";
import { format, parse } from "date-fns";

interface ItineraryCardProps {
  day: ItineraryDay;
}

export function ItineraryCard({ day }: ItineraryCardProps) {
  return (
    <Card className="min-h-[300px]">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          <div>
            <CardTitle className="text-lg">{format(parse(day.date, "yyyy-MM-dd", new Date()), "EEEE, MMMM d")}</CardTitle>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {day.city}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {day.blocks.map((block, idx) => (
          <div key={idx}>
            {idx > 0 && <Separator className="my-4" />}
            <div>
              <Badge className="mb-3">{block.time}</Badge>
              <div className="space-y-3">
                {block.activities.map((activity) => (
                  <div key={activity.id} className="pl-4 border-l-2 border-border">
                    <h4 className="font-medium">{activity.name}</h4>
                    {activity.description && (
                      <p className="text-sm text-muted-foreground mt-1">{activity.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      {activity.estimatedTime && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {activity.estimatedTime}
                        </span>
                      )}
                      {activity.category && (
                        <Badge variant="outline" className="text-xs">{activity.category}</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              {block.travelTime && (
                <p className="text-xs text-muted-foreground mt-2 pl-4">
                  🚗 Travel time: {block.travelTime}
                </p>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
