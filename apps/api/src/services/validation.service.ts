export function validateWorkflow(workflow: any) {
  validateBasic(workflow);
  validateNodeRules(workflow);
  validateEdgeRules(workflow);
  validateOutgoingRules(workflow);
  validateNoCycles(workflow);
  validateReachability(workflow);
}
function validateBasic(workflow: any) {
  if (!workflow.nodes || !workflow.edges) {
    throw new Error("Workflow must contain nodes and edges");
  }

  if (!Array.isArray(workflow.nodes) || !Array.isArray(workflow.edges)) {
    throw new Error("Nodes and edges must be arrays");
  }
}
function validateNodeRules(workflow: any) {
  const starts = workflow.nodes.filter((n: any) => n.type === "start");
  const ends = workflow.nodes.filter((n: any) => n.type === "end");

  if (starts.length !== 1) {
    throw new Error("Workflow must have exactly one Start node");
  }

  if (ends.length < 1) {
    throw new Error("Workflow must have at least one End node");
  }
}
function validateEdgeRules(workflow: any) {
  const nodeIds = new Set(workflow.nodes.map((n: any) => n.id));
  const edgeSet = new Set();

  for (const edge of workflow.edges) {
    if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) {
      throw new Error("Edge references invalid node");
    }

    if (edge.source === edge.target) {
      throw new Error("Self-loop detected");
    }

    const key = `${edge.source}-${edge.target}-${edge.label || ""}`;
    if (edgeSet.has(key)) {
      throw new Error("Duplicate edge detected");
    }

    edgeSet.add(key);
  }
}
function validateOutgoingRules(workflow: any) {
  const outgoingMap: Record<string, any[]> = {};

  for (const edge of workflow.edges) {
    if (!outgoingMap[edge.source]) {
      outgoingMap[edge.source] = [];
    }
    outgoingMap[edge.source].push(edge);
  }

  for (const node of workflow.nodes) {
    const outgoing = outgoingMap[node.id] || [];

    if (node.type === "start" && outgoing.length !== 1) {
      throw new Error("Start node must have exactly one outgoing edge");
    }

    if (node.type === "process" && outgoing.length !== 1) {
      throw new Error("Process node must have exactly one outgoing edge");
    }

    if (node.type === "condition" && outgoing.length !== 2) {
      throw new Error("Condition node must have exactly two outgoing edges");
    }

    if (node.type === "end" && outgoing.length !== 0) {
      throw new Error("End node must not have outgoing edges");
    }
  }
}
function validateNoCycles(workflow: any) {
  const adjacency: Record<string, string[]> = {};

  for (const edge of workflow.edges) {
    if (!adjacency[edge.source]) adjacency[edge.source] = [];
    adjacency[edge.source].push(edge.target);
  }

  const visited = new Set<string>();
  const stack = new Set<string>();

  function dfs(nodeId: string): boolean {
    if (stack.has(nodeId)) return true;
    if (visited.has(nodeId)) return false;

    visited.add(nodeId);
    stack.add(nodeId);

    const neighbors = adjacency[nodeId] || [];
    for (const neighbor of neighbors) {
      if (dfs(neighbor)) return true;
    }

    stack.delete(nodeId);
    return false;
  }

  for (const node of workflow.nodes) {
    if (dfs(node.id)) {
      throw new Error("Cycle detected in workflow");
    }
  }
}
function validateReachability(workflow: any) {
  const startNode = workflow.nodes.find((n: any) => n.type === "start");

  if (!startNode) {
    throw new Error("Start node missing");
  }

  const adjacency: Record<string, string[]> = {};

  for (const node of workflow.nodes) {
    adjacency[node.id] = [];
  }

  for (const edge of workflow.edges) {
    adjacency[edge.source].push(edge.target);
  }

  const visited = new Set<string>();

  function dfs(nodeId: string) {
    if (visited.has(nodeId)) return;
    visited.add(nodeId);

    for (const neighbor of adjacency[nodeId]) {
      dfs(neighbor);
    }
  }

  dfs(startNode.id);

  // Only check nodes that participate in edges
  const connectedNodeIds = new Set<string>();
  workflow.edges.forEach((e: any) => {
    connectedNodeIds.add(e.source);
    connectedNodeIds.add(e.target);
  });

  for (const nodeId of connectedNodeIds) {
    if (!visited.has(nodeId)) {
      throw new Error("Some nodes are not reachable from Start");
    }
  }
}

