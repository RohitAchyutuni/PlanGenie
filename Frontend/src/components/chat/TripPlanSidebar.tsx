import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FlightCard } from "./FlightCard";
import { HotelCard } from "./HotelCard";
import { ItineraryCard } from "./ItineraryCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Flight, Hotel, ItineraryDay } from "@/types/chat";
import { Plane, Hotel as HotelIcon, Calendar } from "lucide-react";

interface TripPlanSidebarProps {
  flights?: Flight[];
  hotels?: Hotel[];
  itinerary?: ItineraryDay[];
  isLoading?: boolean;
}

export function TripPlanSidebar({ flights = [], hotels = [], itinerary = [], isLoading }: TripPlanSidebarProps) {
  const [activeTab, setActiveTab] = useState("flights");
  
  // Debug logging
  console.log("TripPlanSidebar rendered with:", { flightsCount: flights.length, hotelsCount: hotels.length, itineraryCount: itinerary.length, isLoading });

  return (
    <div className="h-full border-l bg-background flex flex-col overflow-hidden">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
        <TabsList className="w-full grid grid-cols-3 rounded-none border-b bg-transparent p-0 flex-shrink-0">
          <TabsTrigger 
            value="flights" 
            className="gap-2 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none hover:bg-accent/50 transition-all"
          >
            <Plane className="h-4 w-4" />
            <span className="hidden sm:inline">Flights</span>
          </TabsTrigger>
          <TabsTrigger 
            value="hotels" 
            className="gap-2 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none hover:bg-accent/50 transition-all"
          >
            <HotelIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Hotels</span>
          </TabsTrigger>
          <TabsTrigger 
            value="itinerary" 
            className="gap-2 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none hover:bg-accent/50 transition-all"
          >
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">Itinerary</span>
          </TabsTrigger>
        </TabsList>

        <ScrollArea className="flex-1 min-h-0">
          <TabsContent value="flights" className="p-4 space-y-4 m-0">
            {isLoading && flights.length === 0 ? (
              <>
                <FlightSkeleton />
                <FlightSkeleton />
                <FlightSkeleton />
              </>
            ) : flights.length > 0 ? (
              flights.map((flight) => (
                <FlightCard key={flight.id} flight={flight} />
              ))
            ) : (
              <EmptyState title="No flights yet" description="Flight options will appear here as they're found" />
            )}
          </TabsContent>

          <TabsContent value="hotels" className="p-4 space-y-4 m-0">
            {isLoading && hotels.length === 0 ? (
              <>
                <HotelSkeleton />
                <HotelSkeleton />
                <HotelSkeleton />
              </>
            ) : hotels.length > 0 ? (
              hotels.map((hotel) => (
                <HotelCard key={hotel.id} hotel={hotel} />
              ))
            ) : (
              <EmptyState title="No hotels yet" description="Hotel options will appear here as they're found" />
            )}
          </TabsContent>

          <TabsContent value="itinerary" className="p-4 space-y-4 m-0">
            {isLoading && itinerary.length === 0 ? (
              <>
                <ItinerarySkeleton />
                <ItinerarySkeleton />
                <ItinerarySkeleton />
              </>
            ) : itinerary.length > 0 ? (
              itinerary.map((day, index) => (
                <ItineraryCard key={`${day.date}-${index}`} day={day} />
              ))
            ) : (
              <EmptyState title="No itinerary yet" description="Daily plans will appear here as they're created" />
            )}
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  );
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <Card>
      <CardContent className="pt-6 text-center">
        <p className="font-medium text-muted-foreground">{title}</p>
        <p className="text-sm text-muted-foreground mt-1">{description}</p>
      </CardContent>
    </Card>
  );
}

function FlightSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-3/4" />
      </CardHeader>
      <CardContent className="space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-10 w-full" />
      </CardContent>
    </Card>
  );
}

function HotelSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-3/4" />
      </CardHeader>
      <CardContent className="space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-32 w-full" />
      </CardContent>
    </Card>
  );
}

function ItinerarySkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-2/3" />
      </CardHeader>
      <CardContent className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
      </CardContent>
    </Card>
  );
}
