import { Workflow } from "../models/workflow.model";
import { validateWorkflow } from "../services/validation.service";
import { executeWorkflow } from "../services/execution.service";

export const execute = async (req: any, res: any) => {
  try {
    const workflow = await Workflow.findById(req.params.id);

    if (!workflow) {
      return res.status(404).json({ error: "Workflow not found" });
    }

    // Validate again before execution
    validateWorkflow(workflow);

    const result = executeWorkflow(workflow);

    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

export const createWorkflow = async (req: any, res: any) => {
  try {
    validateWorkflow(req.body);
    const workflow = await Workflow.create(req.body);
    res.status(201).json(workflow);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};
export const getAll = async (req: any, res: any) => {
  try {
    const workflows = await Workflow.find();
    res.json(workflows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const getById = async (req: any, res: any) => {
  try {
    const workflow = await Workflow.findById(req.params.id);
    if (!workflow) {
      return res.status(404).json({ error: "Workflow not found" });
    }
    res.json(workflow);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const updateWorkflow = async (req: any, res: any) => {
  try {
    validateWorkflow(req.body);

    const workflow = await Workflow.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!workflow) {
      return res.status(404).json({ error: "Workflow not found" });
    }

    res.json(workflow);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

export const deleteWorkflow = async (req: any, res: any) => {
  try {
    const workflow = await Workflow.findByIdAndDelete(req.params.id);

    if (!workflow) {
      return res.status(404).json({ error: "Workflow not found" });
    }

    res.json({ message: "Workflow deleted successfully" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
