import mongoose from "mongoose";

const NodeSchema = new mongoose.Schema({
    id: { type: String, required: true },
    type: {
        type: String,
        enum: ["start", "process", "condition", "end"],
        required: true
    },
    position: {
        x: { type: Number, required: true },
        y: { type: Number, required: true }
    },
    data: { type: Object }
});


const EdgeSchema = new mongoose.Schema({
    id: { type: String, required: true },
    source: { type: String, required: true },
    target: { type: String, required: true },
    label: { type: String }
});

const WorkflowSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        nodes: [NodeSchema],
        edges: [EdgeSchema]
    },
    { timestamps: true }
);

export const Workflow = mongoose.model("Workflow", WorkflowSchema);
