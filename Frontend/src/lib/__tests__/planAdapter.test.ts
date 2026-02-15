/**
 * Smoke test examples for planAdapter
 * Run with: npm test or your test runner
 */

import { mapPlanJsonToUi } from "../planAdapter";
import { Flight, Hotel, ItineraryDay } from "@/types/chat";

// Mock data
const mockFlight: Flight = {
  id: "1",
  airline: "United Airlines",
  flightNumber: "UA 123",
  departAirport: "JFK",
  arriveAirport: "LAX",
  departTime: "10:00 AM",
  arriveTime: "1:00 PM",
  duration: "6h 0m",
  stops: 0,
  cabin: "Economy",
  price: 299,
  currency: "USD"
};

const mockHotel: Hotel = {
  id: "1",
  name: "Grand Hotel",
  stars: 4,
  neighborhood: "Downtown",
  refundable: true,
  nightlyPrice: 150,
  totalPrice: 450,
  currency: "USD",
  amenities: ["WiFi", "Pool"]
};

const mockDay: ItineraryDay = {
  date: "2024-01-15",
  city: "New York",
  blocks: []
};

describe("mapPlanJsonToUi", () => {
  test("handles unified JSON format with itinerary.days", () => {
    const unified = {
      flights: [mockFlight],
      hotels: [mockHotel],
      itinerary: { days: [mockDay] },
      summary: "Great trip!",
      notes: "Bring sunscreen"
    };

    const result = mapPlanJsonToUi(unified);

    expect(result.flights).toEqual([mockFlight]);
    expect(result.hotels).toEqual([mockHotel]);
    expect(result.itineraryDays).toEqual([mockDay]);
    expect(result.summary).toBe("Great trip!");
    expect(result.notes).toBe("Bring sunscreen");
  });

  test("handles legacy format with direct itinerary array", () => {
    const legacy = {
      flights: [mockFlight],
      hotels: [mockHotel],
      itinerary: [mockDay],
      summary: "Legacy format"
    };

    const result = mapPlanJsonToUi(legacy);

    expect(result.itineraryDays).toEqual([mockDay]);
  });

  test("handles missing keys gracefully", () => {
    const partial = {
      flights: [mockFlight]
      // hotels and itinerary missing
    };

    const result = mapPlanJsonToUi(partial);

    expect(result.flights).toEqual([mockFlight]);
    expect(result.hotels).toEqual([]);
    expect(result.itineraryDays).toEqual([]);
    expect(result.summary).toBe("");
    expect(result.notes).toBe("");
  });

  test("handles null/undefined values", () => {
    const withNulls = {
      flights: null,
      hotels: undefined,
      itinerary: { days: null },
      summary: null,
      notes: undefined
    };

    const result = mapPlanJsonToUi(withNulls);

    expect(result.flights).toEqual([]);
    expect(result.hotels).toEqual([]);
    expect(result.itineraryDays).toEqual([]);
    expect(result.summary).toBe("");
    expect(result.notes).toBe("");
  });

  test("handles empty input", () => {
    const result = mapPlanJsonToUi(null);
    expect(result).toEqual({
      flights: [],
      hotels: [],
      itineraryDays: [],
      summary: "",
      notes: ""
    });
  });

  test("filters out null/undefined items from arrays", () => {
    const withNullItems = {
      flights: [mockFlight, null, undefined] as any,
      hotels: [mockHotel, null] as any,
      itinerary: { days: [mockDay, null, undefined] as any }
    };

    const result = mapPlanJsonToUi(withNullItems);

    expect(result.flights).toEqual([mockFlight]);
    expect(result.hotels).toEqual([mockHotel]);
    expect(result.itineraryDays).toEqual([mockDay]);
  });
});

