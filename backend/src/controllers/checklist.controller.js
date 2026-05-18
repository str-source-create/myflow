/**
 * checklist.controller.js
 * CRUD + worker toggle operations for per-task checklist items.
 * completeItem saves the worker’s ID so admin can see who ticked each item.
 */
const ChecklistItem = require('../models/ChecklistItem.model')
const sendResponse = require('../utils/sendResponse')

exports.getChecklist = async (req, res, next) => {
  try {
    const items = await ChecklistItem.find({ taskId: req.params.taskId })
      .sort({ sortOrder: 1 })
      .populate('completedBy', 'name')
    return sendResponse(res, 200, true, 'Checklist fetched', items)
  } catch (err) { next(err) }
}

exports.createItem = async (req, res, next) => {
  try {
    const item = await ChecklistItem.create(req.body)
    return sendResponse(res, 201, true, 'Checklist item created', item)
  } catch (err) { next(err) }
}

/**
 * createManyItems — creates multiple checklist items at once.
 * Used when creating a task with a full area-based checklist.
 * Much faster than creating items one by one.
 */
exports.createManyItems = async (req, res, next) => {
  try {
    const { items } = req.body
    if (!items?.length) return sendResponse(res, 400, false, 'No items provided')
    const created = await ChecklistItem.insertMany(items)
    return sendResponse(res, 201, true, `${created.length} checklist items created`, created)
  } catch (err) { next(err) }
}

exports.updateItem = async (req, res, next) => {
  try {
    const item = await ChecklistItem.findByIdAndUpdate(req.params.id, req.body, { new: true })
    if (!item) return sendResponse(res, 404, false, 'Item not found')
    return sendResponse(res, 200, true, 'Item updated', item)
  } catch (err) { next(err) }
}

exports.deleteItem = async (req, res, next) => {
  try {
    await ChecklistItem.findByIdAndDelete(req.params.id)
    return sendResponse(res, 200, true, 'Item deleted')
  } catch (err) { next(err) }
}

/**
 * completeItem — marks item done and records which worker ticked it.
 */
exports.completeItem = async (req, res, next) => {
  try {
    const item = await ChecklistItem.findByIdAndUpdate(
      req.params.id,
      {
        completed: true,
        completedAt: new Date(),
        completedBy: req.user._id,
      },
      { new: true }
    ).populate('completedBy', 'name')
    if (!item) return sendResponse(res, 404, false, 'Item not found')
    return sendResponse(res, 200, true, 'Item completed', item)
  } catch (err) { next(err) }
}

exports.uncompleteItem = async (req, res, next) => {
  try {
    const item = await ChecklistItem.findByIdAndUpdate(
      req.params.id,
      { completed: false, completedAt: null, completedBy: null },
      { new: true }
    )
    if (!item) return sendResponse(res, 404, false, 'Item not found')
    return sendResponse(res, 200, true, 'Item uncompleted', item)
  } catch (err) { next(err) }
}