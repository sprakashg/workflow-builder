# Workflow Builder

A full-stack visual workflow builder with validation and execution capabilities.

---

## Overview

This application allows users to:

- Create workflows visually
- Connect Start, Process, and End nodes
- Save, update, and delete workflows
- Execute workflows and view execution logs
- Control workflows using chat commands

---

## Tech Stack

### Frontend
- Next.js 16.x
- React 18.x
- TypeScript
- React Flow

### Backend
- Node.js 22.x
- Express 4.x
- MongoDB 6.x
- Mongoose 8.x

Monorepo Structure:
- `apps/api` → Backend
- `apps/web` → Frontend

---

## High-Level Architecture

### Frontend
- Uses React Flow to represent workflows as directed graphs
- Manages node/edge state
- Communicates with backend via REST APIs
- Displays execution logs
- Provides chat-based workflow commands

### Backend
- Persists workflow definitions
- Validates workflow structure
- Executes workflows
- Returns execution logs

### Database
- MongoDB stores workflows as single documents
- Nodes and edges are embedded within each workflow document

---

## Database Model (Conceptual)

```json
{
  "name": "Sample Workflow",
  "nodes": [
    { "id": "node-1", "type": "start", "position": { "x": 100, "y": 250 } },
    { "id": "node-2", "type": "process", "position": { "x": 350, "y": 250 } },
    { "id": "node-3", "type": "end", "position": { "x": 600, "y": 250 } }
  ],
  "edges": [
    { "id": "edge-1", "source": "node-1", "target": "node-2" },
    { "id": "edge-2", "source": "node-2", "target": "node-3" }
  ],
  "createdAt": "...",
  "updatedAt": "..."
}
```

---

## Validation Strategy (Backend)

Before persistence, workflows are validated to ensure:

- Exactly one Start node
- At least one End node
- Valid edge references
- No self-loops
- No duplicate edges
- Correct outgoing edge rules
- No cycles (DFS-based detection)
- Full reachability from Start

Cycle detection and reachability are implemented using Depth First Search (O(V + E)).

---

## Execution Flow

1. Identify Start node  
2. Build adjacency list from edges  
3. Traverse nodes sequentially  
4. Stop at End node  
5. Return execution logs  

Example execution response:

```json
{
  "status": "completed",
  "logs": [
    "Executing node node-1 (start)",
    "Executing node node-2 (process)",
    "Workflow completed"
  ]
}
```

---

## Environment Configuration

Create `apps/api/.env`:

```
PORT=4000
MONGO_URI=mongodb://localhost:27017/workflow
```

---

## Local Setup

### 1. Start MongoDB (Docker Recommended)

```
docker run -d \
  --name workflow-mongo \
  -p 27017:27017 \
  -e MONGO_INITDB_DATABASE=workflow \
  mongo:6
```

### 2. Start Backend

```
cd apps/api
npm install
npm run dev
```

Backend runs on:
http://localhost:4000

### 3. Start Frontend

```
cd apps/web
npm install
npm run dev
```

Frontend runs on:
http://localhost:3000

---

