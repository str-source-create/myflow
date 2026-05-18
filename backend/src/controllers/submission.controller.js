/**
 * submission.controller.js
 * Source file for the cleanflow application.
 */

const Submission = require('../models/Submission.model')
const sendResponse = require('../utils/sendResponse')

exports.getSubmissions = async (req, res, next) => {
  try {
    const filter = {}
    if (req.query.status) filter.reviewStatus = req.query.status
    const submissions = await Submission.find(filter)
      .populate('taskId', 'title date')
      .populate('propertyId', 'name')
      .populate('workerId', 'name email')
      .sort({ submittedAt: -1 })
    return sendResponse(res, 200, true, 'Submissions fetched', submissions)
  } catch (err) { next(err) }
}

exports.getSubmission = async (req, res, next) => {
  try {
    const submission = await Submission.findById(req.params.id)
      .populate('taskId')
      .populate('propertyId')
      .populate('workerId', 'name email phone')
      .populate('reviewedBy', 'name')
    if (!submission) return sendResponse(res, 404, false, 'Submission not found')
    return sendResponse(res, 200, true, 'Submission fetched', submission)
  } catch (err) { next(err) }
}

exports.getSubmissionByTask = async (req, res, next) => {
  try {
    const submission = await Submission.findOne({ taskId: req.params.taskId })
      .populate('workerId', 'name email')
    if (!submission) return sendResponse(res, 404, false, 'No submission found for this task')
    return sendResponse(res, 200, true, 'Submission fetched', submission)
  } catch (err) { next(err) }
}

exports.getWorkerSubmissions = async (req, res, next) => {
  try {
    const submissions = await Submission.find({ workerId: req.params.workerId })
      .populate('taskId', 'title date')
      .populate('propertyId', 'name')
      .sort({ submittedAt: -1 })
    return sendResponse(res, 200, true, 'Worker submissions fetched', submissions)
  } catch (err) { next(err) }
}
