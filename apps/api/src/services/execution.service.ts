export function executeWorkflow(workflow: any) {
    const startNode = workflow.nodes.find((n: any) => n.type === "start");

    const nodeMap: Record<string, any> = {};
    workflow.nodes.forEach((n: any) => {
        nodeMap[n.id] = n;
    });

    const adjacency: Record<string, any[]> = {};
    workflow.edges.forEach((edge: any) => {
        if (!adjacency[edge.source]) adjacency[edge.source] = [];
        adjacency[edge.source].push(edge);
    });

    let current = startNode;
    const logs: string[] = [];

    while (current.type !== "end") {
        logs.push(`Executing node ${current.id} (${current.type})`);

        const outgoing = adjacency[current.id] || [];

        if (current.type === "start" || current.type === "process") {
            current = nodeMap[outgoing[0].target];
        }

        if (current.type === "condition") {
            const result = current.data?.value > 10; // sample logic
            const selected = outgoing.find(
                (e: any) => e.label === (result ? "true" : "false")
            );

            if (!selected) {
                throw new Error("Condition branch missing");
            }

            current = nodeMap[selected.target];
        }
    }

    logs.push("Workflow completed");

    return {
        status: "completed",
        logs
    };
}
