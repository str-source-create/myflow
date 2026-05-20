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
const PropertyChecklist = require('./models/PropertyChecklist.model')

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
  await PropertyChecklist.deleteMany({})

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

  // Create the property-level checklist template for Chalet 34.
  const chaletChecklist = await PropertyChecklist.create({
    propertyId: chalet._id,
    areas: [
      {
        area: 'Kitchen',
        sortOrder: 0,
        items: [
          { label: 'Check that all plates and utensils are clean and that the inside of cabinets and drawers is free of dust and hair', required: true, sortOrder: 0 },
          { label: 'Discard all plastic items or any other belongings left behind by guests', required: true, sortOrder: 1 },
          { label: 'Check dish soap, hand soap, laundry pods, sponge, cloths, garbage bags, and paper towels', required: true, sortOrder: 2 },
          { label: 'Organize all pots, pans, trays, bowls, and kitchen utensils neatly and together', required: true, sortOrder: 3 },
          { label: 'Check for any bad odors under the sink or in the trash and clean/wash if needed', required: true, sortOrder: 4 },
          { label: 'Check the oven exhaust fan for dust and clean', required: true, sortOrder: 5 },
          { label: 'Check under the sink to ensure everything is organized and free of dust and dirt', required: true, sortOrder: 6 },
        ]
      },
      {
        area: 'Bedrooms',
        sortOrder: 1,
        items: [
          { label: 'Check all beds for hair or stains on sheets (do not place linen on the floor)', required: true, sortOrder: 0 },
          { label: 'Check and sweep under the bed', required: true, sortOrder: 1 },
          { label: 'Immediately spray bleach on dirty white linens ONLY', required: true, sortOrder: 2 },
          { label: 'Check the sofa bed: ensure linens are clean, with no hair or dust on top or underneath', required: false, sortOrder: 3 },
          { label: 'Place extra towels and a comforter if required', required: false, sortOrder: 4 },
        ]
      },
      {
        area: 'Bathroom',
        sortOrder: 2,
        items: [
          { label: 'Check all tiles for mold or dark stains and clean', required: true, sortOrder: 0 },
          { label: 'Check for dust/dirt around the toilet, on the bottom, and behind the toilet and surrounding areas', required: true, sortOrder: 1 },
          { label: 'Refill soap, shampoo, and conditioner to above 30%', required: true, sortOrder: 2 },
          { label: 'Organize the cabinet under the sink and remove dust inside', required: true, sortOrder: 3 },
        ]
      },
      {
        area: 'All Areas — Sweeping & Dusting',
        sortOrder: 3,
        items: [
          { label: 'Sweep and clean properly: corners, under beds, tables, and sofa', required: true, sortOrder: 0 },
          { label: 'Check ceilings, lights, and fans (there should NEVER be cobwebs or dust)', required: true, sortOrder: 1 },
          { label: 'Vacuum carpets and check underneath rugs', required: true, sortOrder: 2 },
          { label: 'Check between and under sofa cushions', required: true, sortOrder: 3 },
          { label: 'Dust all areas, furniture, and windows (important to lock windows after cleaning)', required: true, sortOrder: 4 },
          { label: 'Clean all baseboards with a damp cloth (weekly)', required: false, sortOrder: 5 },
          { label: 'Check and clean all interior and exterior glass and mirrors for streaks and fingerprints', required: true, sortOrder: 6 },
        ]
      },
      {
        area: 'Outdoor — Porch / Patio / Spa',
        sortOrder: 4,
        items: [
          { label: 'Arrange chairs properly, sweep outside, and check areas around the spa for garbage', required: true, sortOrder: 0 },
          { label: 'Check and clean the outdoor sauna if applicable', required: false, sortOrder: 1 },
          { label: 'Clean the BBQ and ensure a cleaning brush is available', required: false, sortOrder: 2 },
          { label: 'Check and clean the ashtray (summer)', required: false, sortOrder: 3 },
        ]
      },
      {
        area: 'Final Check',
        sortOrder: 5,
        items: [
          { label: 'Check the thermostat and set the temperature to 21°C or 70°F', required: true, sortOrder: 0 },
          { label: 'Turn off all lights', required: true, sortOrder: 1 },
          { label: 'Ensure all doors and windows are locked', required: true, sortOrder: 2 },
          { label: 'Record cleaning start time, end time, and number of staff', required: true, sortOrder: 3 },
        ]
      },
    ]
  })

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

  // Create task checklist by copying the property template into task-specific items.
  const taskChecklistItems = []
  chaletChecklist.areas.forEach((areaObj, areaIndex) => {
    const sortedItems = [...areaObj.items].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
    sortedItems.forEach((item, itemIndex) => {
      taskChecklistItems.push({
        taskId: task._id,
        propertyId: chalet._id,
        area: areaObj.area,
        title: item.label,
        required: item.required,
        completed: false,
        sortOrder: areaIndex * 100 + itemIndex,
      })
    })
  })

  await ChecklistItem.insertMany(taskChecklistItems)

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
