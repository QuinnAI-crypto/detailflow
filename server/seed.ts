import { db } from "./storage";
import { users, clients, vehicles, services, appointments, quotes, messages, settings } from "@shared/schema";
import { sql } from "drizzle-orm";
import bcrypt from "bcryptjs";

export function seedDatabase() {
  // Create tables with all current schema columns
  db.run(sql`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    business_name TEXT NOT NULL DEFAULT '',
    phone TEXT NOT NULL DEFAULT '',
    onboarding_complete INTEGER NOT NULL DEFAULT 0,
    plan TEXT NOT NULL DEFAULT 'free',
    stripe_customer_id TEXT,
    twilio_phone TEXT,
    auto_create_leads INTEGER NOT NULL DEFAULT 1,
    created_at INTEGER NOT NULL
  )`);

  db.run(sql`CREATE TABLE IF NOT EXISTS clients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    name TEXT NOT NULL,
    email TEXT NOT NULL DEFAULT '',
    phone TEXT NOT NULL DEFAULT '',
    address TEXT,
    notes TEXT,
    is_lead INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
  )`);

  db.run(sql`CREATE TABLE IF NOT EXISTS vehicles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    client_id INTEGER NOT NULL REFERENCES clients(id),
    make TEXT NOT NULL,
    model TEXT NOT NULL,
    year INTEGER NOT NULL,
    color TEXT NOT NULL,
    size TEXT NOT NULL
  )`);

  db.run(sql`CREATE TABLE IF NOT EXISTS services (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    name TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'detailing',
    sedan_price REAL,
    suv_price REAL,
    van_price REAL,
    is_flat INTEGER NOT NULL DEFAULT 0,
    flat_price REAL,
    duration_minutes INTEGER NOT NULL DEFAULT 60,
    active INTEGER NOT NULL DEFAULT 1
  )`);

  db.run(sql`CREATE TABLE IF NOT EXISTS appointments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    client_id INTEGER NOT NULL REFERENCES clients(id),
    vehicle_id INTEGER NOT NULL REFERENCES vehicles(id),
    service_ids TEXT NOT NULL,
    scheduled_at TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'scheduled',
    notes TEXT
  )`);

  db.run(sql`CREATE TABLE IF NOT EXISTS quotes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    client_id INTEGER NOT NULL REFERENCES clients(id),
    vehicle_id INTEGER NOT NULL REFERENCES vehicles(id),
    line_items TEXT NOT NULL,
    total REAL NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft',
    created_at TEXT NOT NULL
  )`);

  db.run(sql`CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    client_id INTEGER NOT NULL REFERENCES clients(id),
    content TEXT NOT NULL,
    direction TEXT NOT NULL,
    channel TEXT NOT NULL,
    sent_at TEXT NOT NULL,
    ai_draft TEXT
  )`);

  db.run(sql`CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT NOT NULL UNIQUE,
    value TEXT NOT NULL
  )`);

  // Check if already seeded
  const existingUsers = db.select().from(users).all();
  if (existingUsers.length > 0) return;

  // Create demo user
  const passwordHash = bcrypt.hashSync("detailflow2026", 10);
  const demoUser = db.insert(users).values({
    email: "demo@detailflow.app",
    passwordHash,
    businessName: "Pristine Auto Detailing",
    phone: "(512) 555-0100",
    onboardingComplete: true,
    plan: "pro",
    stripeCustomerId: null,
    twilioPhone: null,
    autoCreateLeads: true,
    createdAt: new Date(),
  }).returning().get();

  const uid = demoUser.id;

  // Seed all 34 services with categories & durations
  const DEFAULT_SERVICES = [
    { name: "Exterior Hand Wash", category: "Wash & Maintenance", sedanPrice: 40, suvPrice: 55, vanPrice: 70, isFlat: false, flatPrice: null, durationMinutes: 45, active: true },
    { name: "Interior Vacuum & Wipe", category: "Wash & Maintenance", sedanPrice: 50, suvPrice: 65, vanPrice: 80, isFlat: false, flatPrice: null, durationMinutes: 45, active: true },
    { name: "Express Detail (Quick In & Out)", category: "Wash & Maintenance", sedanPrice: 80, suvPrice: 100, vanPrice: 120, isFlat: false, flatPrice: null, durationMinutes: 60, active: true },
    { name: "Maintenance Wash (Existing Coating)", category: "Wash & Maintenance", sedanPrice: 60, suvPrice: 75, vanPrice: 90, isFlat: false, flatPrice: null, durationMinutes: 45, active: true },
    { name: "Full Interior Detail", category: "Full Detail", sedanPrice: 150, suvPrice: 190, vanPrice: 240, isFlat: false, flatPrice: null, durationMinutes: 180, active: true },
    { name: "Full Exterior Detail", category: "Full Detail", sedanPrice: 120, suvPrice: 150, vanPrice: 180, isFlat: false, flatPrice: null, durationMinutes: 120, active: true },
    { name: "Full Detail (Interior + Exterior)", category: "Full Detail", sedanPrice: 250, suvPrice: 320, vanPrice: 400, isFlat: false, flatPrice: null, durationMinutes: 240, active: true },
    { name: "Deep Clean (Heavy Soil/Pet Hair)", category: "Full Detail", sedanPrice: 200, suvPrice: 260, vanPrice: 320, isFlat: false, flatPrice: null, durationMinutes: 240, active: true },
    { name: "Paint Decontamination (Clay Bar)", category: "Paint Correction", sedanPrice: 120, suvPrice: 150, vanPrice: 180, isFlat: false, flatPrice: null, durationMinutes: 120, active: true },
    { name: "1-Stage Paint Correction", category: "Paint Correction", sedanPrice: 250, suvPrice: 325, vanPrice: 400, isFlat: false, flatPrice: null, durationMinutes: 240, active: true },
    { name: "2-Stage Paint Correction", category: "Paint Correction", sedanPrice: 450, suvPrice: 575, vanPrice: 700, isFlat: false, flatPrice: null, durationMinutes: 360, active: true },
    { name: "3-Stage Paint Correction (Show Car)", category: "Paint Correction", sedanPrice: 700, suvPrice: 900, vanPrice: 1100, isFlat: false, flatPrice: null, durationMinutes: 480, active: true },
    { name: "Wet Sand & Polish (Spot)", category: "Paint Correction", sedanPrice: null, suvPrice: null, vanPrice: null, isFlat: true, flatPrice: 100, durationMinutes: 60, active: true },
    { name: "Ceramic Coating — 1 Year", category: "Ceramic Coating", sedanPrice: 350, suvPrice: 450, vanPrice: 550, isFlat: false, flatPrice: null, durationMinutes: 240, active: true },
    { name: "Ceramic Coating — 3 Year", category: "Ceramic Coating", sedanPrice: 600, suvPrice: 750, vanPrice: 900, isFlat: false, flatPrice: null, durationMinutes: 300, active: true },
    { name: "Ceramic Coating — 5 Year", category: "Ceramic Coating", sedanPrice: 900, suvPrice: 1100, vanPrice: 1300, isFlat: false, flatPrice: null, durationMinutes: 360, active: true },
    { name: "Ceramic Coating — Wheels", category: "Ceramic Coating", sedanPrice: null, suvPrice: null, vanPrice: null, isFlat: true, flatPrice: 150, durationMinutes: 60, active: true },
    { name: "Ceramic Coating — Glass", category: "Ceramic Coating", sedanPrice: null, suvPrice: null, vanPrice: null, isFlat: true, flatPrice: 100, durationMinutes: 45, active: true },
    { name: "PPF — Partial Front (Hood/Bumper/Mirrors)", category: "Paint Protection Film (PPF)", sedanPrice: 900, suvPrice: 1100, vanPrice: 1300, isFlat: false, flatPrice: null, durationMinutes: 360, active: true },
    { name: "PPF — Full Front End", category: "Paint Protection Film (PPF)", sedanPrice: 1500, suvPrice: 1800, vanPrice: 2100, isFlat: false, flatPrice: null, durationMinutes: 480, active: true },
    { name: "PPF — Track Pack (Front + Rockers)", category: "Paint Protection Film (PPF)", sedanPrice: 2200, suvPrice: 2600, vanPrice: 3000, isFlat: false, flatPrice: null, durationMinutes: 600, active: true },
    { name: "PPF — Full Body Wrap", category: "Paint Protection Film (PPF)", sedanPrice: 5000, suvPrice: 6000, vanPrice: 7000, isFlat: false, flatPrice: null, durationMinutes: 2400, active: true },
    { name: "Window Tint — 2 Front Windows (Carbon)", category: "Window Tint", sedanPrice: null, suvPrice: null, vanPrice: null, isFlat: true, flatPrice: 150, durationMinutes: 60, active: true },
    { name: "Window Tint — Full Car (Carbon)", category: "Window Tint", sedanPrice: 300, suvPrice: 400, vanPrice: 350, isFlat: false, flatPrice: null, durationMinutes: 120, active: true },
    { name: "Window Tint — Full Car (Ceramic)", category: "Window Tint", sedanPrice: 450, suvPrice: 600, vanPrice: 500, isFlat: false, flatPrice: null, durationMinutes: 150, active: true },
    { name: "Window Tint — Windshield Strip", category: "Window Tint", sedanPrice: null, suvPrice: null, vanPrice: null, isFlat: true, flatPrice: 75, durationMinutes: 30, active: true },
    { name: "Window Tint — Sunroof", category: "Window Tint", sedanPrice: null, suvPrice: null, vanPrice: null, isFlat: true, flatPrice: 75, durationMinutes: 30, active: true },
    { name: "Headlight Restoration", category: "Add-Ons", sedanPrice: null, suvPrice: null, vanPrice: null, isFlat: true, flatPrice: 75, durationMinutes: 45, active: true },
    { name: "Engine Bay Cleaning", category: "Add-Ons", sedanPrice: 100, suvPrice: 120, vanPrice: 140, isFlat: false, flatPrice: null, durationMinutes: 60, active: true },
    { name: "Odor Elimination", category: "Add-Ons", sedanPrice: 80, suvPrice: 100, vanPrice: 120, isFlat: false, flatPrice: null, durationMinutes: 60, active: true },
    { name: "Leather Conditioning", category: "Add-Ons", sedanPrice: 60, suvPrice: 75, vanPrice: 90, isFlat: false, flatPrice: null, durationMinutes: 45, active: true },
    { name: "Wheel & Tire Detail", category: "Add-Ons", sedanPrice: 50, suvPrice: 65, vanPrice: 80, isFlat: false, flatPrice: null, durationMinutes: 45, active: true },
    { name: "Trim Restoration", category: "Add-Ons", sedanPrice: 80, suvPrice: 100, vanPrice: 120, isFlat: false, flatPrice: null, durationMinutes: 60, active: true },
    { name: "Scratch Removal (Per Panel)", category: "Add-Ons", sedanPrice: null, suvPrice: null, vanPrice: null, isFlat: true, flatPrice: 75, durationMinutes: 30, active: true },
  ];

  const insertedServices: any[] = [];
  for (const s of DEFAULT_SERVICES) {
    const svc = db.insert(services).values({ ...s, userId: uid }).returning().get();
    insertedServices.push(svc);
  }

  // Seed clients
  const clientData = [
    { name: "Marcus Thompson", email: "marcus.t@email.com", phone: "(512) 555-0147", address: "4821 Riverside Dr, Austin TX 78701", notes: "Prefers weekend appointments", isLead: false, createdAt: "2024-11-15T10:00:00Z", userId: uid },
    { name: "Sarah Chen", email: "sarah.chen@email.com", phone: "(512) 555-0283", address: "1200 Congress Ave, Austin TX 78701", notes: "Fleet account - 3 vehicles", isLead: false, createdAt: "2024-10-22T14:30:00Z", userId: uid },
    { name: "David Rodriguez", email: "d.rodriguez@email.com", phone: "(512) 555-0391", address: "7600 N Lamar Blvd, Austin TX 78752", notes: null, isLead: false, createdAt: "2025-01-05T09:00:00Z", userId: uid },
    { name: "Jennifer Walsh", email: "jwalsh@email.com", phone: "(512) 555-0465", address: "3400 S 1st St, Austin TX 78704", notes: "Referred by Marcus Thompson", isLead: false, createdAt: "2025-02-10T11:00:00Z", userId: uid },
    { name: "Tyler Kim", email: "tyler.kim@email.com", phone: "(512) 555-0512", address: "9001 Research Blvd, Austin TX 78758", notes: "Monthly ceramic maintenance plan", isLead: false, createdAt: "2024-12-01T16:00:00Z", userId: uid },
    { name: "New Lead", email: "", phone: "(512) 555-0678", address: null, notes: null, isLead: true, createdAt: "2025-04-07T08:30:00Z", userId: uid },
  ];
  const insertedClients: any[] = [];
  for (const c of clientData) {
    const cl = db.insert(clients).values(c).returning().get();
    insertedClients.push(cl);
  }

  // Seed vehicles
  const vehicleData = [
    { clientId: insertedClients[0].id, make: "BMW", model: "M3", year: 2023, color: "Black Sapphire", size: "sedan", userId: uid },
    { clientId: insertedClients[1].id, make: "Toyota", model: "4Runner", year: 2024, color: "Lunar Rock", size: "suv", userId: uid },
    { clientId: insertedClients[2].id, make: "Ford", model: "F-150", year: 2022, color: "Oxford White", size: "suv", userId: uid },
    { clientId: insertedClients[3].id, make: "Tesla", model: "Model 3", year: 2024, color: "Pearl White", size: "sedan", userId: uid },
    { clientId: insertedClients[4].id, make: "Mercedes", model: "GLE 450", year: 2023, color: "Obsidian Black", size: "suv", userId: uid },
  ];
  const insertedVehicles: any[] = [];
  for (const v of vehicleData) {
    const ve = db.insert(vehicles).values(v).returning().get();
    insertedVehicles.push(ve);
  }

  // Seed appointments
  const now = new Date();
  const monday = new Date(now);
  const day = monday.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  monday.setDate(now.getDate() + diff);
  monday.setHours(0, 0, 0, 0);

  // Map service names to their IDs
  function findSvcId(name: string): number {
    const svc = insertedServices.find((s: any) => s.name.toLowerCase().includes(name.toLowerCase()));
    return svc ? svc.id : insertedServices[0].id;
  }

  const aptData = [
    { clientId: insertedClients[0].id, vehicleId: insertedVehicles[0].id, serviceIds: JSON.stringify([findSvcId("Exterior Hand Wash"), findSvcId("Interior Vacuum")]), scheduledAt: getDateTime(monday, 0, 9, 0), status: "complete", notes: "Regular bi-weekly wash", userId: uid },
    { clientId: insertedClients[1].id, vehicleId: insertedVehicles[1].id, serviceIds: JSON.stringify([findSvcId("Full Detail (Interior + Exterior)")]), scheduledAt: getDateTime(monday, 0, 14, 0), status: "complete", notes: null, userId: uid },
    { clientId: insertedClients[2].id, vehicleId: insertedVehicles[2].id, serviceIds: JSON.stringify([findSvcId("Exterior Hand Wash"), findSvcId("Engine Bay")]), scheduledAt: getDateTime(monday, 1, 10, 0), status: "in_progress", notes: "Engine bay is very dirty", userId: uid },
    { clientId: insertedClients[3].id, vehicleId: insertedVehicles[3].id, serviceIds: JSON.stringify([findSvcId("Ceramic Coating — 1 Year"), findSvcId("1-Stage Paint Correction")]), scheduledAt: getDateTime(monday, 2, 9, 30), status: "scheduled", notes: "New car prep package", userId: uid },
    { clientId: insertedClients[4].id, vehicleId: insertedVehicles[4].id, serviceIds: JSON.stringify([findSvcId("Full Detail (Interior + Exterior)"), findSvcId("Headlight Restoration")]), scheduledAt: getDateTime(monday, 2, 13, 0), status: "scheduled", notes: null, userId: uid },
    { clientId: insertedClients[0].id, vehicleId: insertedVehicles[0].id, serviceIds: JSON.stringify([findSvcId("Paint Decontamination"), findSvcId("1-Stage Paint Correction")]), scheduledAt: getDateTime(monday, 3, 10, 0), status: "scheduled", notes: "Paint correction before coating", userId: uid },
    { clientId: insertedClients[1].id, vehicleId: insertedVehicles[1].id, serviceIds: JSON.stringify([findSvcId("Exterior Hand Wash"), findSvcId("Odor Elimination")]), scheduledAt: getDateTime(monday, 4, 11, 0), status: "scheduled", notes: "Dog odor in back seat", userId: uid },
    { clientId: insertedClients[2].id, vehicleId: insertedVehicles[2].id, serviceIds: JSON.stringify([findSvcId("Ceramic Coating — 3 Year")]), scheduledAt: getDateTime(monday, 5, 9, 0), status: "scheduled", notes: "3-year ceramic package", userId: uid },
  ];
  for (const a of aptData) {
    db.insert(appointments).values(a).run();
  }

  // Seed quotes
  const quoteData = [
    {
      clientId: insertedClients[0].id, vehicleId: insertedVehicles[0].id,
      lineItems: JSON.stringify([
        { serviceId: findSvcId("Ceramic Coating — 1 Year"), serviceName: "Ceramic Coating — 1 Year", price: 350 },
        { serviceId: findSvcId("1-Stage Paint Correction"), serviceName: "1-Stage Paint Correction", price: 250 },
      ]),
      total: 600, status: "accepted", createdAt: "2025-01-20T10:00:00Z", userId: uid,
    },
    {
      clientId: insertedClients[1].id, vehicleId: insertedVehicles[1].id,
      lineItems: JSON.stringify([
        { serviceId: findSvcId("Ceramic Coating — 3 Year"), serviceName: "Ceramic Coating — 3 Year", price: 750 },
        { serviceId: findSvcId("Paint Decontamination"), serviceName: "Paint Decontamination (Clay Bar)", price: 150 },
        { serviceId: findSvcId("Headlight Restoration"), serviceName: "Headlight Restoration", price: 75 },
      ]),
      total: 975, status: "sent", createdAt: "2025-02-05T14:00:00Z", userId: uid,
    },
    {
      clientId: insertedClients[3].id, vehicleId: insertedVehicles[3].id,
      lineItems: JSON.stringify([
        { serviceId: findSvcId("Full Detail (Interior + Exterior)"), serviceName: "Full Detail (Interior + Exterior)", price: 150 },
      ]),
      total: 150, status: "draft", createdAt: "2025-02-12T09:00:00Z", userId: uid,
    },
    {
      clientId: insertedClients[4].id, vehicleId: insertedVehicles[4].id,
      lineItems: JSON.stringify([
        { serviceId: findSvcId("Full Detail (Interior + Exterior)"), serviceName: "Full Detail (Interior + Exterior)", price: 190 },
        { serviceId: findSvcId("Engine Bay"), serviceName: "Engine Bay Cleaning", price: 120 },
        { serviceId: findSvcId("Odor Elimination"), serviceName: "Odor Elimination", price: 100 },
      ]),
      total: 410, status: "declined", createdAt: "2025-01-30T11:00:00Z", userId: uid,
    },
  ];
  for (const q of quoteData) {
    db.insert(quotes).values(q).run();
  }

  // Seed messages
  const messageData = [
    { clientId: insertedClients[0].id, content: "Hi Marcus! Your appointment for Exterior Hand Wash is confirmed for Monday at 9:00 AM.", direction: "outbound", channel: "sms", sentAt: getDateTime(monday, -1, 10, 0), aiDraft: null, userId: uid },
    { clientId: insertedClients[0].id, content: "Thanks! Can you add an interior wipe-down too?", direction: "inbound", channel: "sms", sentAt: getDateTime(monday, -1, 10, 15), aiDraft: null, userId: uid },
    { clientId: insertedClients[0].id, content: "Absolutely! I've updated your appointment to include Interior Vacuum & Wipe. Total will be $110.", direction: "outbound", channel: "sms", sentAt: getDateTime(monday, -1, 10, 20), aiDraft: null, userId: uid },
    { clientId: insertedClients[0].id, content: "Perfect, see you Monday.", direction: "inbound", channel: "sms", sentAt: getDateTime(monday, -1, 10, 25), aiDraft: null, userId: uid },
    { clientId: insertedClients[0].id, content: "Reminder: Your appointment is tomorrow at 9:00 AM. See you then!", direction: "outbound", channel: "sms", sentAt: getDateTime(monday, -1, 18, 0), aiDraft: null, userId: uid },
    { clientId: insertedClients[0].id, content: "Your BMW M3 is looking sharp! Thanks for coming in today. Would you mind leaving us a review?", direction: "outbound", channel: "sms", sentAt: getDateTime(monday, 0, 11, 0), aiDraft: null, userId: uid },
    { clientId: insertedClients[0].id, content: "Done! Left you 5 stars. You guys do great work.", direction: "inbound", channel: "sms", sentAt: getDateTime(monday, 0, 14, 30), aiDraft: null, userId: uid },
    { clientId: insertedClients[1].id, content: "Hi Sarah, we've prepared a quote for your 4Runner's ceramic coating and paint decontamination. Total: $975. Check your email for details.", direction: "outbound", channel: "sms", sentAt: "2025-02-05T14:30:00Z", aiDraft: null, userId: uid },
    { clientId: insertedClients[1].id, content: "Got it. That's a bit more than I expected. Can you break down the pricing?", direction: "inbound", channel: "sms", sentAt: "2025-02-05T15:00:00Z", aiDraft: null, userId: uid },
    { clientId: insertedClients[1].id, content: "Of course! Ceramic Coating (3 Year) for SUV: $750, Paint Decontamination: $150, Headlight Restoration: $75. The 3-year coating is our best value.", direction: "outbound", channel: "sms", sentAt: "2025-02-05T15:10:00Z", aiDraft: null, userId: uid },
    { clientId: insertedClients[1].id, content: "That makes sense. Let me think about it. When's your next available slot?", direction: "inbound", channel: "sms", sentAt: "2025-02-05T15:30:00Z", aiDraft: null, userId: uid },
    { clientId: insertedClients[1].id, content: "We have openings next Friday and Saturday. Want me to hold a spot?", direction: "outbound", channel: "sms", sentAt: "2025-02-05T15:35:00Z", aiDraft: null, userId: uid },
    // New lead message
    { clientId: insertedClients[5].id, content: "Hey, how much for a full detail on my Tahoe?", direction: "inbound", channel: "sms", sentAt: getDateTime(monday, 0, 8, 30), aiDraft: "Hey there! For a Full Detail (Interior + Exterior) on an SUV, we're at $320. Want me to get you on the schedule? I have openings this Thursday morning, Thursday afternoon, and next Friday.", userId: uid },
  ];
  for (const m of messageData) {
    db.insert(messages).values(m).run();
  }

  // Seed settings
  const settingsData = [
    { key: "business_name", value: "Pristine Auto Detailing" },
    { key: "business_phone", value: "(512) 555-0100" },
    { key: "business_address", value: "2400 S Congress Ave, Austin TX 78704" },
    { key: "auto_booking_confirmation", value: "true" },
    { key: "auto_24hr_reminder", value: "true" },
    { key: "auto_followup", value: "true" },
    { key: "auto_review_request", value: "false" },
    { key: "auto_create_leads", value: "true" },
  ];
  for (const s of settingsData) {
    db.insert(settings).values(s).run();
  }

  console.log("Database seeded with demo account (demo@detailflow.app / detailflow2026)");
}

function getDateTime(baseDate: Date, dayOffset: number, hour: number, minute: number): string {
  const d = new Date(baseDate);
  d.setDate(d.getDate() + dayOffset);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}
