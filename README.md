# PlanGenie
# AI Agent Coordination for Planning Travel Itineraries

## 📌 Summary
This project demonstrates **multi-agent orchestration** for end-to-end journey planning.  
A **Main Orchestrator Agent** receives natural language input from the user, extracts trip details, and delegates tasks to specialized sub-agents to complete different components of the request.

## 🤖 Agents
- **Flight Ticket Agent**  
  Retrieves ticket information and flight alternatives.  

- **Accommodation Agent**  
  Locates and manages reservations for lodging (hotels, rentals, etc.).  

- **Itinerary Agent**  
  Creates a comprehensive daily itinerary for the journey.  

## 🔄 Workflow
1. The user enters travel information in plain language (destination, dates, preferences).  
2. The **Main Orchestrator Agent** parses the request.  
3. Flight, lodging, and itinerary arrangements are gathered by calling upon the relevant sub-agents.  
4. Outputs are combined into a **full structured itinerary**.  

## 📂 Project Status
We are currently in the **setup phase**.  
This README will be updated with:
- Installation and setup guidelines  
- System architecture diagrams  
- Usage examples and screenshots  

## 🚀 Anticipated Features
- Parsing trip requests in natural language  
- Automated flight search & booking  
- Smart accommodation recommendations  
- Day-wise itinerary generation  
- Extensible and modular orchestration framework  

---

## 📖 Next Steps
- [ ] Add installation & setup instructions  
- [ ] Provide architecture diagrams  
- [ ] Add usage examples and sample runs  
- [ ] Prepare contribution guidelines  

---

## 📜 License
*(Add license type here, e.g., MIT, Apache 2.0, etc.)*
