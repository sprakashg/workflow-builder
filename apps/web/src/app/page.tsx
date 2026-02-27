"use client";

import React, { useCallback, useEffect, useState } from "react";
import ReactFlow, {
  Background,
  Controls,
  addEdge,
  useNodesState,
  useEdgesState,
  Connection,
  Edge,
  Node,
  Handle,
  Position,
  useReactFlow,
  ReactFlowProvider,
} from "reactflow";
import "reactflow/dist/style.css";

/* =========================
   Custom Nodes
========================= */

const nodeStyle: React.CSSProperties = {
  padding: 10,
  borderRadius: 8,
  background: "#1e293b",
  color: "white",
  border: "1px solid #334155",
  minWidth: 100,
  textAlign: "center",
};

const StartNode = ({ data }: any) => (
  <div style={nodeStyle}>
    <div>{data.label}</div>
    <Handle type="source" position={Position.Right} />
  </div>
);

const ProcessNode = ({ data }: any) => (
  <div style={nodeStyle}>
    <Handle type="target" position={Position.Left} />
    <div>{data.label}</div>
    <Handle type="source" position={Position.Right} />
  </div>
);

const EndNode = ({ data }: any) => (
  <div style={nodeStyle}>
    <Handle type="target" position={Position.Left} />
    <div>{data.label}</div>
  </div>
);

/* =========================
   Canvas Component
========================= */

function WorkflowCanvas() {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node[]>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge[]>([]);
  const [workflowId, setWorkflowId] = useState<string | null>(null);
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [selectedWorkflowId, setSelectedWorkflowId] = useState("");
  const [workflowName, setWorkflowName] = useState("");
  const [logs, setLogs] = useState<string[]>([]);

  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<
    { role: "user" | "system"; text: string }[]
  >([]);

  const { fitView } = useReactFlow();

  const nodeTypes = {
    start: StartNode,
    process: ProcessNode,
    end: EndNode,
  };

  useEffect(() => {
    loadWorkflows();
    setChatMessages([
      {
        role: "system",
        text: "Welcome! Type 'save', 'execute', or 'new' to control the workflow.",
      },
    ]);
  }, []);

  async function loadWorkflows() {
    const res = await fetch("http://localhost:4000/api/workflows");
    const data = await res.json();
    setWorkflows(data);
  }

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds) =>
        addEdge(
          {
            ...connection,
            id: crypto.randomUUID(),
            type: "straight",
          },
          eds,
        ),
      );
    },
    [setEdges],
  );

  /* =========================
     Add Node
  ========================= */

  const addNode = (type: "start" | "process" | "end") => {
    if (type === "start" && nodes.some((n) => n.type === "start")) {
      alert("Only one Start node allowed");
      return;
    }

    if (type === "end" && nodes.some((n) => n.type === "end")) {
      alert("Only one End node allowed");
      return;
    }

    let position;

    if (type === "start") position = { x: 100, y: 250 };
    else if (type === "process") position = { x: 350, y: 250 };
    else position = { x: 600, y: 250 };

    const newNode: Node = {
      id: crypto.randomUUID(),
      position,
      data: { label: type.toUpperCase() },
      type,
    };

    setNodes((nds) => [...nds, newNode]);
  };

  /* =========================
     New Workflow
  ========================= */

  const createNewWorkflow = () => {
    setNodes([]);
    setEdges([]);
    setWorkflowId(null);
    setSelectedWorkflowId("");
    setWorkflowName("");
    setLogs([]);
  };

  /* =========================
     Save / Update
  ========================= */

  const saveWorkflow = async () => {
    const name = workflowName.trim() || `Workflow-${workflows.length + 1}`;

    const payload = {
      name,
      nodes: nodes.map((n) => ({
        id: n.id,
        type: n.type,
        position: n.position,
      })),
      edges: edges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
      })),
    };

    const url = workflowId
      ? `http://localhost:4000/api/workflows/${workflowId}`
      : "http://localhost:4000/api/workflows";

    const method = workflowId ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (res.ok) {
      const isUpdate = !!workflowId;
      setWorkflowId(data._id);
      setWorkflowName(name);
      loadWorkflows();
      alert(
        isUpdate
          ? "Workflow updated successfully ✅"
          : "Workflow saved successfully ✅",
      );
    } else {
      alert(data.error);
    }
  };

  /* =========================
     Load
  ========================= */

  const loadWorkflow = async () => {
    if (!selectedWorkflowId) return;

    const res = await fetch(
      `http://localhost:4000/api/workflows/${selectedWorkflowId}`,
    );

    const data = await res.json();

    const loadedNodes: Node[] = data.nodes.map((n: any) => ({
      id: n.id,
      position: n.position,
      data: { label: n.type.toUpperCase() },
      type: n.type,
    }));

    const loadedEdges: Edge[] = data.edges.map((e: any) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      type: "straight",
    }));

    setNodes(loadedNodes);
    setEdges(loadedEdges);
    setWorkflowId(data._id);
    setWorkflowName(data.name);
    setLogs([]);

    setTimeout(() => fitView(), 50);
  };

  const deleteWorkflow = async () => {
    if (!workflowId) {
      alert("Select a workflow first");
      return;
    }

    const confirmDelete = window.confirm(
      "Are you sure you want to delete this workflow?",
    );

    if (!confirmDelete) return;

    await fetch(`http://localhost:4000/api/workflows/${workflowId}`, {
      method: "DELETE",
    });

    alert("Workflow deleted successfully 🗑️");

    createNewWorkflow();
    loadWorkflows();
  };

  const executeWorkflow = async () => {
    if (!workflowId) return alert("Save workflow first");

    const res = await fetch(
      `http://localhost:4000/api/workflows/${workflowId}/execute`,
      { method: "POST" },
    );

    const data = await res.json();

    if (res.ok) setLogs(data.logs);
    else alert(data.error);
  };

  /* =========================
     Chat Logic
  ========================= */

  const handleChat = async () => {
    if (!chatInput.trim()) return;

    const command = chatInput.toLowerCase();

    setChatMessages((prev) => [...prev, { role: "user", text: chatInput }]);

    let response = "";

    if (command.includes("save")) {
      await saveWorkflow();
      response = "Workflow saved.";
    } else if (command.includes("execute")) {
      await executeWorkflow();
      response = "Workflow executed.";
    } else if (command.includes("new")) {
      createNewWorkflow();
      response = "Started new workflow.";
    } else {
      response = "Unknown command. Available commands: save, execute, new";
    }

    setChatMessages((prev) => [...prev, { role: "system", text: response }]);

    setChatInput("");
  };

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        background: "#0f172a",
        color: "white",
      }}
    >
      {/* LEFT PANEL */}
      <div
        style={{
          flex: 3,
          display: "flex",
          flexDirection: "column",
          borderRight: "1px solid #1e293b",
        }}
      >
        <div
          style={{
            padding: 12,
            display: "flex",
            gap: 10,
            alignItems: "center",
            background: "#111827",
          }}
        >
          <input
            value={workflowName}
            onChange={(e) => setWorkflowName(e.target.value)}
            placeholder="Workflow name"
            style={inputStyle}
          />

          {workflowId && (
            <button style={btnSecondary} onClick={createNewWorkflow}>
              + New
            </button>
          )}

          <button style={btnPrimary} onClick={() => addNode("start")}>
            Start
          </button>
          <button style={btnPrimary} onClick={() => addNode("process")}>
            Process
          </button>
          <button style={btnPrimary} onClick={() => addNode("end")}>
            End
          </button>
          <button style={btnSuccess} onClick={saveWorkflow}>
            {workflowId ? "Update" : "Save"}
          </button>
          <button style={btnWarning} onClick={executeWorkflow}>
            Execute
          </button>

          <select
            value={selectedWorkflowId}
            onChange={(e) => setSelectedWorkflowId(e.target.value)}
            style={selectStyle}
          >
            <option value="">Select Workflow</option>
            {workflows.map((wf) => (
              <option key={wf._id} value={wf._id}>
                {wf.name}
              </option>
            ))}
          </select>

          <button style={btnPrimary} onClick={loadWorkflow}>
            Load
          </button>
          <button style={btnDanger} onClick={deleteWorkflow}>
            Delete
          </button>
        </div>

        <div style={{ flex: 1 }}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
          >
            <Background gap={20} size={1} color="#334155" />
            <Controls />
          </ReactFlow>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div
        style={{
          flex: 1,
          padding: 20,
          background: "#1e293b",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <h3>Execution Logs</h3>
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            background: "#0f172a",
            padding: 10,
            marginBottom: 10,
          }}
        >
          {logs.map((log, i) => (
            <div key={i}>{log}</div>
          ))}
        </div>

        <h3>Chat</h3>

        <div
          style={{
            background: "#111827",
            padding: 10,
            borderRadius: 6,
            marginBottom: 10,
            fontSize: 12,
            color: "#94a3b8",
          }}
        >
          <strong>Available Commands:</strong>
          <div>• save → Save or update workflow</div>
          <div>• execute → Run workflow</div>
          <div>• new → Start a new workflow</div>
        </div>
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            background: "#0f172a",
            padding: 10,
            marginBottom: 10,
          }}
        >
          {chatMessages.map((msg, i) => (
            <div
              key={i}
              style={{ color: msg.role === "user" ? "#facc15" : "#38bdf8" }}
            >
              <b>{msg.role}:</b> {msg.text}
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <input
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Type command..."
            style={inputStyle}
          />
          <button style={btnPrimary} onClick={handleChat}>
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

/* =========================
   Root
========================= */

export default function Home() {
  return (
    <ReactFlowProvider>
      <WorkflowCanvas />
    </ReactFlowProvider>
  );
}

/* =========================
   Styles
========================= */

const inputStyle = {
  padding: "6px 10px",
  borderRadius: 6,
  background: "#0f172a",
  border: "1px solid #334155",
  color: "white",
};

const btnPrimary = {
  padding: "6px 14px",
  borderRadius: 6,
  background: "#1e293b",
  color: "white",
  border: "none",
  cursor: "pointer",
};

const btnSuccess = { ...btnPrimary, background: "#16a34a" };
const btnWarning = { ...btnPrimary, background: "#f59e0b", color: "black" };
const btnSecondary = { ...btnPrimary, background: "#475569" };
const btnDanger = { ...btnPrimary, background: "#dc2626" };

const selectStyle = {
  padding: "6px 12px",
  borderRadius: 6,
  backgroundColor: "#1e293b",
  color: "white",
  border: "1px solid #334155",
};
