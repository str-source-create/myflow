/**
 * seed.js
 * Source file for the cleanflow application.
 */

require('dotenv').config()
const mongoose = require('mongoose')
const connectDB = require('./config/db')

const User         = require('./models/User.model')
const Property     = require('./models/Property.model')
const Standard     = require('./models/Standard.model')
const Task         = require('./models/Task.model')
const ChecklistItem= require('./models/ChecklistItem.model')

const today = new Date().toISOString().split('T')[0]

async function seed() {
  await connectDB()

  // Clear existing data
  console.log('Clearing old seed data...')
  await User.deleteMany({})
  await Property.deleteMany({})
  await Standard.deleteMany({})
  await Task.deleteMany({})
  await ChecklistItem.deleteMany({})

  // Create admin
  const admin = await User.create({
    name: 'Sarah Admin',
    email: 'admin@cleanflow.com',
    password: 'admin123',
    role: 'admin'
  })

  // Create workers
  const jessica = await User.create({
    name: 'Jessica Chen',
    email: 'jessica@cleanflow.com',
    password: 'worker123',
    role: 'worker',
    tasksCompleted: 47,
    streak: 5
  })

  await User.create({
    name: 'Alex Moreau',
    email: 'alex@cleanflow.com',
    password: 'worker123',
    role: 'worker',
    tasksCompleted: 33
  })

  await User.create({
    name: 'Maria Santos',
    email: 'maria@cleanflow.com',
    password: 'worker123',
    role: 'worker',
    tasksCompleted: 21
  })

  // Create property
  const chalet = await Property.create({
    name: 'Chalet 34',
    address: '123 Pine Ridge Rd',
    wifiName: 'Chalet34_WiFi',
    wifiPassword: 'chalet2024',
    gpsLocation: 'https://maps.google.com/?q=123+Pine+Ridge+Rd',
    accessNotes: 'Use the main entrance. Lockbox code is 4821.',
    parkingNotes: 'Park in the gravel lot on the left side.',
    cleaningNotes: 'Pay special attention to the basement bathroom cabinet.',
    importantNotes: 'Electrical room and boiler keys are on the kitchen counter. Return them to the right kitchen cabinet after use.',
    createdBy: admin._id
  })

  const pine = await Property.create({
    name: 'Pine House 12',
    address: '456 Forest Trail',
    wifiName: 'PineHouse_WiFi',
    wifiPassword: 'pine2024',
    accessNotes: 'Key under the front mat.',
    importantNotes: 'Balcony doors must be locked before leaving.',
    createdBy: admin._id
  })

  // Create standards for Chalet 34
  await Standard.insertMany([
    { propertyId: chalet._id, areaName: 'Basement Bathroom Cabinet', instruction: 'Stock with bath, spa, bed, kitchen linens, and spare bedding. Organize exactly like the reference photo.', required: true, sortOrder: 1 },
    { propertyId: chalet._id, areaName: 'Bathroom Setup',            instruction: 'Prepare bathroom exactly like the reference photo. Towels folded, supplies arranged, mirror polished.', required: true, sortOrder: 2 },
    { propertyId: chalet._id, areaName: 'Pool Table and Sofa Table',  instruction: 'Arrange pool table and sofa table exactly like the reference photo.', required: true, sortOrder: 3 },
    { propertyId: chalet._id, areaName: 'Bed Setup',                  instruction: 'Make bed with bath linen and 2 pillows. Must match reference photo.', required: true, sortOrder: 4 },
  ])

  // Create today's task for Jessica
  const task = await Task.create({
    title: 'Chalet 34 - Turnover Cleaning',
    propertyId: chalet._id,
    assignedWorkerIds: [jessica._id],
    date: today,
    startTime: '10:00',
    endTime: '14:00',
    taskType: 'turnover',
    priority: 'high',
    status: 'scheduled',
    managerNotes: 'Follow all reference standards exactly. Photos are required.',
    createdBy: admin._id
  })

  // Create checklist for that task
  const checklist = [
    { area: 'Kitchen',  title: 'Countertops cleaned',      required: true,  sortOrder: 1 },
    { area: 'Kitchen',  title: 'Sink cleaned',             required: true,  sortOrder: 2 },
    { area: 'Kitchen',  title: 'Fridge checked',           required: true,  sortOrder: 3 },
    { area: 'Kitchen',  title: 'Trash removed',            required: true,  sortOrder: 4 },
    { area: 'Bathroom', title: 'Toilet cleaned',           required: true,  sortOrder: 5 },
    { area: 'Bathroom', title: 'Shower/tub cleaned',       required: true,  sortOrder: 6 },
    { area: 'Bathroom', title: 'Towels placed',            required: true,  sortOrder: 7 },
    { area: 'Bedroom',  title: 'Beds made',                required: true,  sortOrder: 8 },
    { area: 'Bedroom',  title: '2 pillows placed',         required: true,  sortOrder: 9 },
    { area: 'Living',   title: 'Sofa arranged',            required: true,  sortOrder: 10 },
    { area: 'Living',   title: 'Floors vacuumed',          required: true,  sortOrder: 11 },
    { area: 'Basement', title: 'Pool table cleaned',       required: false, sortOrder: 12 },
    { area: 'Basement', title: 'Cabinet organized',        required: false, sortOrder: 13 },
    { area: 'Final',    title: 'Keys returned to cabinet', required: true,  sortOrder: 14 },
    { area: 'Final',    title: 'Property is guest-ready',  required: true,  sortOrder: 15 },
  ]

  await ChecklistItem.insertMany(
    checklist.map(item => ({ ...item, taskId: task._id, propertyId: chalet._id }))
  )

  // Create a second task for Pine House
  await Task.create({
    title: 'Pine House 12 - Turnover Cleaning',
    propertyId: pine._id,
    assignedWorkerIds: [jessica._id],
    date: today,
    startTime: '15:00',
    endTime: '19:00',
    taskType: 'turnover',
    priority: 'medium',
    status: 'scheduled',
    createdBy: admin._id
  })

  console.log('')
  console.log('==================================')
  console.log('  CleanFlow Seed Complete!')
  console.log('==================================')
  console.log('')
  console.log('  ADMIN LOGIN')
  console.log('  URL:      http://localhost:5173/admin/login')
  console.log('  Email:    admin@cleanflow.com')
  console.log('  Password: admin123')
  console.log('')
  console.log('  WORKER LOGIN')
  console.log('  URL:      http://localhost:5173/worker/login')
  console.log('  Email:    jessica@cleanflow.com')
  console.log('  Password: worker123')
  console.log('')
  console.log('  API running at: http://localhost:3000')
  console.log('  Health check:   http://localhost:3000/')
  console.log('==================================')

  mongoose.connection.close()
}

seed().catch(err => {
  console.error('Seed failed:', err.message)
  mongoose.connection.close()
  process.exit(1)
})
