# PlanGenie
# AI Agent Orchestration for Travel Itinerary Planning

## Overview
This project demonstrates *multi-agent orchestration* for end-to-end travel planning.  
A *Main Orchestrator Agent* receives natural language input from the user, extracts key trip details, and coordinates specialized sub-agents to fulfill different parts of the request.

## Agents
- *Flight Ticket Agent* 
  Fetches flight options and ticket details.  

- *Accommodation Agent*   
  Finds and manages stay bookings (hotels, rentals, etc.).  

- *Itinerary Agent* 
  Designs a detailed day-by-day schedule for the trip.  

## Workflow
1. User provides trip details in plain language (e.g., destination, dates, preferences).  
2. The *Main Orchestrator Agent* parses the request.  
3. Relevant sub-agents are invoked to gather flights, accommodations, and itinerary plans.  
4. Outputs are aggregated into a *complete structured itinerary*.  

## Project Status
Currently in the *setup phase*.  
This README will be updated with:
- Installation & setup instructions  
- System architecture diagrams  
- Usage examples and screenshots  

## Planned Features
- Natural language trip request parsing  
- Automated flight search & booking  
- Smart accommodation recommendations  
- Day-wise itinerary generation  
- Modular and extendable orchestration framework
