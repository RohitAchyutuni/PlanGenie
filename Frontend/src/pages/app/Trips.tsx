import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Calendar, Plus } from "lucide-react";

export default function Trips() {
  // Mock saved trips
  const trips = [
    {
      id: "1",
      destination: "Paris, France",
      dates: "Jun 15-22, 2025",
      status: "planned",
      travelers: 2
    },
    {
      id: "2",
      destination: "Tokyo, Japan",
      dates: "Sep 10-20, 2025",
      status: "booked",
      travelers: 1
    }
  ];

  return (
    <div className="container max-w-6xl py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Trips</h1>
          <p className="text-muted-foreground">View and manage your saved trips</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Plan New Trip
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {trips.map((trip) => (
          <Card key={trip.id} className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" />
                    {trip.destination}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-2 mt-2">
                    <Calendar className="h-4 w-4" />
                    {trip.dates}
                  </CardDescription>
                </div>
                <Badge variant={trip.status === "booked" ? "default" : "secondary"}>
                  {trip.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {trip.travelers} {trip.travelers === 1 ? "traveler" : "travelers"}
              </p>
              <div className="flex gap-2 mt-4">
                <Button size="sm" className="flex-1">View Details</Button>
                <Button size="sm" variant="outline" className="flex-1">Edit Trip</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
