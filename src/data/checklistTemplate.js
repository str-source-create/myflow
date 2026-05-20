/**
 * checklistTemplate.js
 *
 * The official CleanFlow cleaning checklist template.
 * Used by ALL task creation flows: Tasks page and Calendar modal.
 * Based on the production cleaning guide PDF (31 items, 6 areas).
 *
 * Import this in CreateTaskPage.jsx AND TaskFormModal.jsx to ensure
 * both create tasks with the same default checklist structure.
 */

export const DEFAULT_CHECKLIST_TEMPLATE = [
  {
    area: 'Kitchen',
    items: [
      {
        label: 'Check that all plates and utensils are clean and that the inside of cabinets and drawers is free of dust and hair',
        required: true
      },
      {
        label: 'Discard all plastic items or any other belongings left behind by guests',
        required: true
      },
      {
        label: 'Check dish soap, hand soap, laundry pods, sponge, cloths, garbage bags, and paper towels',
        required: true
      },
      {
        label: 'Organize all pots, pans, trays, bowls, and kitchen utensils neatly and together',
        required: true
      },
      {
        label: 'Check for any bad odors under the sink or in the trash and clean/wash if needed',
        required: true
      },
      {
        label: 'Check the oven exhaust fan for dust and clean',
        required: true
      },
      {
        label: 'Check under the sink to ensure everything is organized and free of dust and dirt',
        required: true
      },
    ]
  },
  {
    area: 'Bedrooms',
    items: [
      {
        label: 'Check all beds for hair or stains on sheets (do not place linen on the floor)',
        required: true
      },
      { label: 'Check and sweep under the bed', required: true },
      { label: 'Immediately spray bleach on dirty white linens ONLY', required: true },
      {
        label: 'Check the sofa bed: ensure linens are clean, with no hair or dust on top or underneath',
        required: false
      },
      { label: 'Place extra towels and a comforter if required', required: false },
    ]
  },
  {
    area: 'Bathroom',
    items: [
      { label: 'Check all tiles for mold or dark stains and clean', required: true },
      {
        label: 'Check for dust/dirt around the toilet, on the bottom, and behind the toilet and surrounding areas',
        required: true
      },
      { label: 'Refill soap, shampoo, and conditioner to above 30%', required: true },
      { label: 'Organize the cabinet under the sink and remove dust inside', required: true },
    ]
  },
  {
    area: 'All Areas — Sweeping & Dusting',
    items: [
      { label: 'Sweep and clean properly: corners, under beds, tables, and sofa', required: true },
      { label: 'Check ceilings, lights, and fans (there should NEVER be cobwebs or dust)', required: true },
      { label: 'Vacuum carpets and check underneath rugs', required: true },
      { label: 'Check between and under sofa cushions', required: true },
      { label: 'Dust all areas, furniture, and windows (important to lock windows after cleaning)', required: true },
      { label: 'Clean all baseboards with a damp cloth (weekly)', required: false },
      { label: 'Check and clean all interior and exterior glass and mirrors for streaks and fingerprints', required: true },
    ]
  },
  {
    area: 'Outdoor — Porch / Patio / Spa',
    items: [
      {
        label: 'Arrange chairs properly, sweep outside, and check areas around the spa for garbage',
        required: true
      },
      { label: 'Check and clean the outdoor sauna if applicable', required: false },
      { label: 'Clean the BBQ and ensure cleaning brush is available', required: false },
      { label: 'Check and clean the ashtray (summer)', required: false },
    ]
  },
  {
    area: 'Final Check',
    items: [
      { label: 'Check the thermostat and set the temperature to 21°C or 70°F', required: true },
      { label: 'Turn off all lights', required: true },
      { label: 'Ensure all doors and windows are locked', required: true },
      { label: 'Record cleaning start time, end time, and number of staff', required: true },
    ]
  },
]

/**
 * buildChecklistItems — converts the template into flat ChecklistItem objects
 * ready to be saved to the database via POST /api/checklist/batch or
 * embedded in the task creation payload.
 *
 * @param {Array} areas - the areas array from the checklist builder state
 *   (each area has { area: string, items: [{ label, required, selected }] })
 * @returns {Array} flat array of checklist item objects for the API
 */
export const buildChecklistItems = (areas) => {
  const items = []
  areas.forEach((section, areaIndex) => {
    section.items
      .filter((item) => item.selected !== false)
      .forEach((item, itemIndex) => {
        items.push({
          area:      section.area,
          title:     item.label || item.title,
          required:  item.required,
          sortOrder: areaIndex * 100 + itemIndex,
        })
      })
  })
  return items
}
