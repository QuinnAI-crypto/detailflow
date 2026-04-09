import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { requireAuth, signToken, type AuthRequest } from "./auth";
import bcrypt from "bcryptjs";
import {
  insertClientSchema,
  insertVehicleSchema,
  insertAppointmentSchema,
  insertQuoteSchema,
  insertMessageSchema,
  insertServiceSchema,
} from "@shared/schema";
import { sendSMS, sendEmail } from "./external-tools";
import { sendBookingConfirmation, sendPostServiceFollowup, sendQuoteEmail } from "./automations";
import multer from "multer";
import * as XLSX from "xlsx";

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

const DEFAULT_SERVICES = [
  // WASH & MAINTENANCE
  { name: "Exterior Hand Wash", category: "Wash & Maintenance", sedanPrice: 40, suvPrice: 55, vanPrice: 70, isFlat: false, flatPrice: null, durationMinutes: 45, active: true },
  { name: "Interior Vacuum & Wipe", category: "Wash & Maintenance", sedanPrice: 50, suvPrice: 65, vanPrice: 80, isFlat: false, flatPrice: null, durationMinutes: 45, active: true },
  { name: "Express Detail (Quick In & Out)", category: "Wash & Maintenance", sedanPrice: 80, suvPrice: 100, vanPrice: 120, isFlat: false, flatPrice: null, durationMinutes: 60, active: true },
  { name: "Maintenance Wash (Existing Coating)", category: "Wash & Maintenance", sedanPrice: 60, suvPrice: 75, vanPrice: 90, isFlat: false, flatPrice: null, durationMinutes: 45, active: true },
  // FULL DETAIL
  { name: "Full Interior Detail", category: "Full Detail", sedanPrice: 150, suvPrice: 190, vanPrice: 240, isFlat: false, flatPrice: null, durationMinutes: 180, active: true },
  { name: "Full Exterior Detail", category: "Full Detail", sedanPrice: 120, suvPrice: 150, vanPrice: 180, isFlat: false, flatPrice: null, durationMinutes: 120, active: true },
  { name: "Full Detail (Interior + Exterior)", category: "Full Detail", sedanPrice: 250, suvPrice: 320, vanPrice: 400, isFlat: false, flatPrice: null, durationMinutes: 240, active: true },
  { name: "Deep Clean (Heavy Soil/Pet Hair)", category: "Full Detail", sedanPrice: 200, suvPrice: 260, vanPrice: 320, isFlat: false, flatPrice: null, durationMinutes: 240, active: true },
  // PAINT CORRECTION
  { name: "Paint Decontamination (Clay Bar)", category: "Paint Correction", sedanPrice: 120, suvPrice: 150, vanPrice: 180, isFlat: false, flatPrice: null, durationMinutes: 120, active: true },
  { name: "1-Stage Paint Correction", category: "Paint Correction", sedanPrice: 250, suvPrice: 325, vanPrice: 400, isFlat: false, flatPrice: null, durationMinutes: 240, active: true },
  { name: "2-Stage Paint Correction", category: "Paint Correction", sedanPrice: 450, suvPrice: 575, vanPrice: 700, isFlat: false, flatPrice: null, durationMinutes: 360, active: true },
  { name: "3-Stage Paint Correction (Show Car)", category: "Paint Correction", sedanPrice: 700, suvPrice: 900, vanPrice: 1100, isFlat: false, flatPrice: null, durationMinutes: 480, active: true },
  { name: "Wet Sand & Polish (Spot)", category: "Paint Correction", sedanPrice: null, suvPrice: null, vanPrice: null, isFlat: true, flatPrice: 100, durationMinutes: 60, active: true },
  // CERAMIC COATING
  { name: "Ceramic Coating — 1 Year", category: "Ceramic Coating", sedanPrice: 350, suvPrice: 450, vanPrice: 550, isFlat: false, flatPrice: null, durationMinutes: 240, active: true },
  { name: "Ceramic Coating — 3 Year", category: "Ceramic Coating", sedanPrice: 600, suvPrice: 750, vanPrice: 900, isFlat: false, flatPrice: null, durationMinutes: 300, active: true },
  { name: "Ceramic Coating — 5 Year", category: "Ceramic Coating", sedanPrice: 900, suvPrice: 1100, vanPrice: 1300, isFlat: false, flatPrice: null, durationMinutes: 360, active: true },
  { name: "Ceramic Coating — Wheels", category: "Ceramic Coating", sedanPrice: null, suvPrice: null, vanPrice: null, isFlat: true, flatPrice: 150, durationMinutes: 60, active: true },
  { name: "Ceramic Coating — Glass", category: "Ceramic Coating", sedanPrice: null, suvPrice: null, vanPrice: null, isFlat: true, flatPrice: 100, durationMinutes: 45, active: true },
  // PPF
  { name: "PPF — Partial Front (Hood/Bumper/Mirrors)", category: "Paint Protection Film (PPF)", sedanPrice: 900, suvPrice: 1100, vanPrice: 1300, isFlat: false, flatPrice: null, durationMinutes: 360, active: true },
  { name: "PPF — Full Front End", category: "Paint Protection Film (PPF)", sedanPrice: 1500, suvPrice: 1800, vanPrice: 2100, isFlat: false, flatPrice: null, durationMinutes: 480, active: true },
  { name: "PPF — Track Pack (Front + Rockers)", category: "Paint Protection Film (PPF)", sedanPrice: 2200, suvPrice: 2600, vanPrice: 3000, isFlat: false, flatPrice: null, durationMinutes: 600, active: true },
  { name: "PPF — Full Body Wrap", category: "Paint Protection Film (PPF)", sedanPrice: 5000, suvPrice: 6000, vanPrice: 7000, isFlat: false, flatPrice: null, durationMinutes: 2400, active: true },
  // WINDOW TINT
  { name: "Window Tint — 2 Front Windows (Carbon)", category: "Window Tint", sedanPrice: null, suvPrice: null, vanPrice: null, isFlat: true, flatPrice: 150, durationMinutes: 60, active: true },
  { name: "Window Tint — Full Car (Carbon)", category: "Window Tint", sedanPrice: 300, suvPrice: 400, vanPrice: 350, isFlat: false, flatPrice: null, durationMinutes: 120, active: true },
  { name: "Window Tint — Full Car (Ceramic)", category: "Window Tint", sedanPrice: 450, suvPrice: 600, vanPrice: 500, isFlat: false, flatPrice: null, durationMinutes: 150, active: true },
  { name: "Window Tint — Windshield Strip", category: "Window Tint", sedanPrice: null, suvPrice: null, vanPrice: null, isFlat: true, flatPrice: 75, durationMinutes: 30, active: true },
  { name: "Window Tint — Sunroof", category: "Window Tint", sedanPrice: null, suvPrice: null, vanPrice: null, isFlat: true, flatPrice: 75, durationMinutes: 30, active: true },
  // ADD-ONS
  { name: "Headlight Restoration", category: "Add-Ons", sedanPrice: null, suvPrice: null, vanPrice: null, isFlat: true, flatPrice: 75, durationMinutes: 45, active: true },
  { name: "Engine Bay Cleaning", category: "Add-Ons", sedanPrice: 100, suvPrice: 120, vanPrice: 140, isFlat: false, flatPrice: null, durationMinutes: 60, active: true },
  { name: "Odor Elimination", category: "Add-Ons", sedanPrice: 80, suvPrice: 100, vanPrice: 120, isFlat: false, flatPrice: null, durationMinutes: 60, active: true },
  { name: "Leather Conditioning", category: "Add-Ons", sedanPrice: 60, suvPrice: 75, vanPrice: 90, isFlat: false, flatPrice: null, durationMinutes: 45, active: true },
  { name: "Wheel & Tire Detail", category: "Add-Ons", sedanPrice: 50, suvPrice: 65, vanPrice: 80, isFlat: false, flatPrice: null, durationMinutes: 45, active: true },
  { name: "Trim Restoration", category: "Add-Ons", sedanPrice: 80, suvPrice: 100, vanPrice: 120, isFlat: false, flatPrice: null, durationMinutes: 60, active: true },
  { name: "Scratch Removal (Per Panel)", category: "Add-Ons", sedanPrice: null, suvPrice: null, vanPrice: null, isFlat: true, flatPrice: 75, durationMinutes: 30, active: true },
];

// ===== AI DRAFT REPLY ENGINE =====
type ReplyStyle = 'professional' | 'casual' | 'direct';

function styleGreeting(firstName: string, style: ReplyStyle): string {
  switch (style) {
    case 'professional': return `Thank you for reaching out, ${firstName}.`;
    case 'direct': return `Hi ${firstName}!`;
    default: return `Hey ${firstName}!`;
  }
}

function styleOpener(style: ReplyStyle): string {
  switch (style) {
    case 'professional': return "I'd be happy to assist you with that.";
    case 'direct': return '';
    default: return '';
  }
}

function generateAiDraft(context: {
  lastMessage: string;
  clientName: string;
  services: any[];
  vehicles: any[];
  appointments: any[];
  businessName?: string;
  style?: ReplyStyle;
  isFirstContact?: boolean;
}): string {
  const msg = context.lastMessage.toLowerCase().trim();
  const firstName = context.clientName.split(" ")[0] || "there";
  const style: ReplyStyle = context.style || 'casual';
  const biz = context.businessName || 'our shop';

  // Helper to find matching service
  function findService(keywords: string[]): any | null {
    for (const svc of context.services) {
      const svcLower = svc.name.toLowerCase();
      for (const kw of keywords) {
        if (svcLower.includes(kw)) return svc;
      }
    }
    return null;
  }

  function detectVehicleSize(): string {
    const suvWords = ["suv", "truck", "tahoe", "suburban", "expedition", "4runner", "highlander", "rav4", "crv", "cx-5", "cx5", "explorer", "yukon", "escalade", "durango", "pilot", "pathfinder", "wrangler", "jeep", "bronco", "defender"];
    const vanWords = ["van", "sienna", "odyssey", "pacifica", "carnival", "sprinter", "transit"];
    for (const w of suvWords) if (msg.includes(w)) return "SUV";
    for (const w of vanWords) if (msg.includes(w)) return "van";
    if (context.vehicles?.length) {
      const size = context.vehicles[0].size;
      return size === "suv" ? "SUV" : size === "van" ? "van" : "sedan";
    }
    return "vehicle";
  }

  function getPrice(svc: any, sizeLabel: string): number {
    if (svc.isFlat) return svc.flatPrice || 0;
    const s = sizeLabel.toLowerCase();
    if (s === "suv") return svc.suvPrice || 0;
    if (s === "van") return svc.vanPrice || 0;
    return svc.sedanPrice || 0;
  }

  function getNextSlots(): string {
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const now = new Date();
    const slots: string[] = [];
    for (let i = 1; i <= 7 && slots.length < 3; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() + i);
      if (d.getDay() === 0) continue; // skip Sunday
      const dayName = days[d.getDay() - 1] || "Saturday";
      if (slots.length === 0) slots.push(`this ${dayName} morning`);
      else if (slots.length === 1) slots.push(`${dayName} afternoon`);
      else slots.push(`next ${dayName}`);
    }
    return slots.join(", ") || "later this week";
  }

  // FIRST CONTACT (new lead greeting)
  if (context.isFirstContact) {
    if (style === 'professional') {
      return `Thank you for reaching out to ${biz}, ${firstName}. How may I assist you today?`;
    } else if (style === 'direct') {
      return `Hi ${firstName}! Thanks for texting ${biz}. How can I help?`;
    }
    return `Hey! Thanks for reaching out to ${biz}. How can I help you today?`;
  }

  // PRICE INQUIRY
  if (msg.match(/how much|price|cost|quote|pricing|what do you charge|rates/i)) {
    // "what are your prices" — top 5 services summary
    if (msg.match(/prices|pricing|rates|menu|what do you charge/i) && !msg.match(/detail|ceramic|tint|ppf|correction|wash/i)) {
      const popular = context.services.filter((s: any) => s.active).slice(0, 5);
      if (popular.length > 0) {
        const lines = popular.map((s: any) => {
          const p = s.isFlat ? `$${s.flatPrice}` : `$${s.sedanPrice}+`;
          return `${s.name} — ${p}`;
        }).join('\n');
        if (style === 'professional') return `Thank you for your interest, ${firstName}. Here are some of our popular services:\n\n${lines}\n\nI'd be happy to provide a detailed quote for your specific vehicle.`;
        if (style === 'direct') return `Here's our top services:\n\n${lines}\n\nWhat are you looking for?`;
        return `Hey ${firstName}! Here are some of our most popular services:\n\n${lines}\n\nWant me to put together a custom quote for your ride?`;
      }
    }
    if (msg.match(/detail|full detail|interior.*exterior/i)) {
      const svc = findService(["full detail (interior"]) || findService(["full detail"]);
      const size = detectVehicleSize();
      if (svc) {
        const price = getPrice(svc, size);
        if (style === 'professional') return `${firstName}, our Full Detail (Interior + Exterior) for a ${size} is $${price}. Shall I check availability for you?`;
        if (style === 'direct') return `Full detail on a ${size}: $${price}. Want me to book you in?`;
        return `Hey ${firstName}! For a Full Detail (Interior + Exterior) on a ${size}, we're at $${price}. Want me to get you on the schedule? I have openings ${getNextSlots()}.`;
      }
    }
    if (msg.match(/ceramic|coating/i)) {
      const svc = findService(["ceramic coating — 3 year"]) || findService(["ceramic coating"]);
      const size = detectVehicleSize();
      if (svc) {
        const price = getPrice(svc, size);
        if (style === 'professional') return `${firstName}, our most popular ceramic coating option is the 3-Year package at $${price} for a ${size}, which includes full paint decontamination. Would you like a detailed breakdown?`;
        if (style === 'direct') return `3-Year Ceramic Coating on a ${size}: $${price}. Includes decon. Want the full breakdown?`;
        return `Hey ${firstName}! Ceramic coating is one of the best things you can do for your paint. Our most popular option is the 3-Year Ceramic Coating at $${price} for a ${size}. That includes full paint decontamination before application. Want me to send over a full breakdown?`;
      }
    }
    if (msg.match(/tint|window/i)) {
      const svc = findService(["window tint — full car (ceramic)"]) || findService(["window tint"]);
      if (svc) {
        const price = svc.isFlat ? svc.flatPrice : svc.sedanPrice;
        if (style === 'direct') return `Ceramic tint (full car) starts at $${price}. Carbon is less. Want a quote?`;
        return `Hey ${firstName}! Window tint pricing depends on what you're looking for. Our most popular is the Ceramic tint (full car) starting at $${price}. We also have Carbon film options if you want to save a bit. Want me to put together a quote?`;
      }
    }
    if (msg.match(/ppf|protection film|clear bra|wrap/i)) {
      const svc = findService(["ppf — full front"]);
      const size = detectVehicleSize();
      if (svc) {
        const price = getPrice(svc, size);
        return `Hey ${firstName}! Great choice protecting your paint! Our Full Front End PPF package (hood, bumper, fenders, mirrors) is $${price} for a ${size}. We also offer partial front and full body options. Want me to send the full PPF menu?`;
      }
    }
    if (msg.match(/paint correction|polish|buff|scratch|swirl/i)) {
      const svc = findService(["1-stage paint correction"]);
      const size = detectVehicleSize();
      if (svc) {
        const price = getPrice(svc, size);
        return `Hey ${firstName}! For paint correction, it depends on the condition of the paint. A 1-Stage correction (removes ~70-80% of swirls) starts at $${price} for a ${size}. For heavier defects, we'd do a 2-Stage or 3-Stage. Happy to take a look and give you an exact quote!`;
      }
    }
    if (msg.match(/wash|quick|express|maintenance/i)) {
      const svc = findService(["express detail"]) || findService(["exterior hand wash"]);
      const size = detectVehicleSize();
      if (svc) {
        const price = getPrice(svc, size);
        if (style === 'direct') return `${svc.name}: $${price} for a ${size}. About an hour. Book?`;
        return `Hey ${firstName}! Our ${svc.name} is $${price} for a ${size}. Quick turnaround — usually about an hour. Want to book one?`;
      }
    }
    // Generic price inquiry
    if (style === 'professional') return `Thank you for your inquiry, ${firstName}. I'd be happy to provide a quote. Could you let me know which services you're interested in? We offer everything from maintenance washes to full paint correction and ceramic coatings.`;
    if (style === 'direct') return `What service are you looking for? I'll get you a price right away.`;
    return `Hey ${firstName}! I'd be happy to get you a quote. What services are you looking for? I can send over our full service menu if that helps — we cover everything from basic washes to full paint correction and ceramic coatings.`;
  }

  // SCHEDULING / BOOKING
  if (msg.match(/appointment|schedule|book|available|opening|when can|slot|time/i)) {
    const slots = getNextSlots();
    // Check for specific day mention
    const dayMatch = msg.match(/\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday|today|tomorrow)\b/i);
    if (dayMatch) {
      const day = dayMatch[1];
      if (style === 'direct') return `${day.charAt(0).toUpperCase() + day.slice(1)} works. Morning or afternoon?`;
      return `Hey ${firstName}! ${day.charAt(0).toUpperCase() + day.slice(1)} looks good — I have spots open in the morning and afternoon. What time works best? And what service(s) are you looking for?`;
    }
    // "what time do you open" / hours
    if (msg.match(/open|hours|close|when do you/i)) {
      return `Hey ${firstName}! We're open Monday through Saturday, 9 AM to 6 PM. Closed on Sundays. Want me to get you booked?`;
    }
    if (style === 'professional') return `${firstName}, I have availability ${slots}. Which time works best for you? And may I confirm which services you'd like?`;
    if (style === 'direct') return `I have openings ${slots}. What works? What service do you need?`;
    return `Hey ${firstName}! I've got openings ${slots}. Which works best for you? And just to confirm — what service(s) are you looking to get done?`;
  }

  // HOURS question (standalone, outside booking context)
  if (msg.match(/what time|hours|when.*open|when.*close/i)) {
    return `Hey ${firstName}! We're open Monday through Saturday, 9 AM to 6 PM. Closed on Sundays. Want to book something?`;
  }

  // CONFIRMATION / YES
  if (msg.match(/^(yes|yeah|yep|sure|sounds good|let's do it|book it|perfect|do it|that works|i'm down|go for it)/i)) {
    return `Awesome, ${firstName}! You're all set. I'll send over a confirmation with all the details shortly. See you then! 🤝`;
  }

  // THANK YOU
  if (msg.match(/thank|thanks|appreciate|thx/i)) {
    return `You're welcome, ${firstName}! Looking forward to it. Let me know if anything comes up before your appointment. 👊`;
  }

  // CANCEL / RESCHEDULE
  if (msg.match(/cancel|reschedule|change.*time|move.*appointment|push back|rain check/i)) {
    return `No worries, ${firstName}! Life happens. Let me know what day/time works better for you and I'll get you rebooked. We've got openings ${getNextSlots()}.`;
  }

  // RUNNING LATE
  if (msg.match(/running late|be late|delayed|stuck|traffic/i)) {
    return `No problem at all, ${firstName}! Take your time — just shoot me a text when you're close and we'll be ready for you. 👍`;
  }

  // ETA / HOW LONG
  if (msg.match(/how long|eta|when.*ready|when.*done|time.*take/i)) {
    return `Good question, ${firstName}! Depends on the service, but I'll keep you posted throughout. I'll send you a text as soon as we're wrapping up.`;
  }

  // COMPLIMENT
  if (msg.match(/looks great|amazing|awesome job|beautiful|love it|incredible|clean/i)) {
    return `Really appreciate that, ${firstName}! It was a pleasure working on your ride. If you get a chance, a quick Google review would mean the world to us — helps us keep growing! 🙏`;
  }

  // REFERRAL
  if (msg.match(/friend|recommend|refer|someone|buddy|coworker/i)) {
    return `Absolutely, ${firstName}! Tell them to reach out anytime — they can text this number or I can send them our booking link. We always appreciate referrals! 🙌`;
  }

  // QUESTIONS ABOUT SERVICES
  if (msg.match(/what.*offer|what.*do|services|menu|what can/i)) {
    return `Hey ${firstName}! We offer a full range of services — exterior washes, full interior/exterior details, paint correction, ceramic coatings, PPF, window tint, and more. Want me to send over our complete service menu with pricing?`;
  }

  // VEHICLE QUESTIONS
  if (msg.match(/\b(truck|suv|van|rv|boat|motorcycle|bike)\b/i) && msg.match(/\b(do you|can you|work on)\b/i)) {
    return `Absolutely, ${firstName}! We work on all vehicle types — sedans, SUVs, trucks, and vans. What do you need done?`;
  }
  if (msg.match(/do you.*mobile|come to me|mobile.*detail|come to you/i)) {
    return `Yes! We come to you. Just let me know your address when you're ready to book and we'll get it set up.`;
  }

  // LOCATION
  if (msg.match(/where|location|address|directions/i)) {
    return `Hey ${firstName}! Great question. You can check our location details in your booking confirmation, or I can come to you if you're in our service area. What works best?`;
  }

  // PAYMENT
  if (msg.match(/pay|payment|card|cash|venmo|zelle|invoice/i)) {
    return `Hey ${firstName}! We accept all major credit/debit cards, cash, Venmo, and Zelle. Whatever's easiest for you! Payment is due at pickup.`;
  }

  // DEFAULT — unrecognized message, mark for human review
  if (style === 'professional') return `Thank you for your message, ${firstName}. Let me look into that and get back to you shortly.`;
  if (style === 'direct') return `Got it, ${firstName}. I'll get back to you shortly.`;
  return `Hey ${firstName}! Got your message. Let me get back to you shortly.`;
}

// ===== SMART SCHEDULING =====
function getSuggestedSlots(appointments: any[], services: any[], serviceIds: number[]): string[] {
  // Calculate total duration
  let totalDuration = 0;
  for (const svcId of serviceIds) {
    const svc = services.find((s: any) => s.id === svcId);
    if (svc) totalDuration += svc.durationMinutes || 60;
  }
  if (totalDuration === 0) totalDuration = 60;
  const bufferMinutes = 30;

  const now = new Date();
  const slots: string[] = [];
  
  // Check next 14 days, Mon-Sat, 9am-6pm
  for (let day = 0; day < 14 && slots.length < 3; day++) {
    const d = new Date(now);
    d.setDate(d.getDate() + day);
    d.setHours(9, 0, 0, 0);
    
    if (d.getDay() === 0) continue; // Skip Sunday
    if (d < now && day === 0) {
      d.setHours(Math.max(9, now.getHours() + 1), 0, 0, 0);
      if (d.getHours() >= 18) continue;
    }

    // Check hours 9-18
    for (let hour = d.getHours(); hour <= 18 - Math.ceil(totalDuration / 60) && slots.length < 3; hour++) {
      const slotStart = new Date(d);
      slotStart.setHours(hour, 0, 0, 0);
      const slotEnd = new Date(slotStart.getTime() + totalDuration * 60000);
      
      if (slotEnd.getHours() > 18 || (slotEnd.getHours() === 18 && slotEnd.getMinutes() > 0)) continue;

      // Check for conflicts
      let conflict = false;
      for (const apt of appointments) {
        const aptStart = new Date(apt.scheduledAt);
        // estimate existing apt duration
        let aptDuration = 60;
        try {
          const aptSvcIds: number[] = JSON.parse(apt.serviceIds);
          aptDuration = 0;
          for (const id of aptSvcIds) {
            const s = services.find((sv: any) => sv.id === id);
            if (s) aptDuration += s.durationMinutes || 60;
          }
        } catch {}
        if (aptDuration === 0) aptDuration = 60;
        const aptEnd = new Date(aptStart.getTime() + (aptDuration + bufferMinutes) * 60000);
        const bufferedSlotEnd = new Date(slotEnd.getTime() + bufferMinutes * 60000);
        
        if (slotStart < aptEnd && bufferedSlotEnd > aptStart) {
          conflict = true;
          break;
        }
      }
      
      if (!conflict) {
        slots.push(slotStart.toISOString());
      }
    }
  }
  
  return slots;
}

function sanitizeUser(user: any) {
  const { passwordHash, ...safe } = user;
  return safe;
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // ========== AUTH ROUTES (public) ==========

  app.post("/api/auth/signup", async (req: AuthRequest, res) => {
    try {
      const { email, password, businessName } = req.body;
      if (!email || !password || !businessName) {
        return res.status(400).json({ error: "Email, password, and business name are required" });
      }
      if (password.length < 8) {
        return res.status(400).json({ error: "Password must be at least 8 characters" });
      }
      const existing = storage.getUserByEmail(email);
      if (existing) {
        return res.status(409).json({ error: "An account with that email already exists" });
      }
      const passwordHash = await bcrypt.hash(password, 10);
      const user = storage.createUser({ email, passwordHash, businessName, phone: "", onboardingComplete: false, plan: "free", stripeCustomerId: null, twilioPhone: null, autoCreateLeads: true, phoneSetupType: null, businessPhone: null, twilioPhoneSid: null, phoneSetupStatus: null, smsEnabled: false, aiAutoReply: true, aiAutoPrice: true, aiAutoSchedule: false, aiReplyStyle: 'casual' });
      // Create default services for this user
      for (const svc of DEFAULT_SERVICES) {
        storage.createService({ ...svc, userId: user.id });
      }
      const token = signToken(user.id);
      res.status(201).json({ token, user: sanitizeUser(user) });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/auth/login", async (req: AuthRequest, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }
      const user = storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ error: "Invalid email or password" });
      }
      const valid = await bcrypt.compare(password, user.passwordHash);
      if (!valid) {
        return res.status(401).json({ error: "Invalid email or password" });
      }
      const token = signToken(user.id);
      res.json({ token, user: sanitizeUser(user) });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/auth/me", requireAuth, (req: AuthRequest, res) => {
    const user = storage.getUserById(req.userId!);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ user: sanitizeUser(user) });
  });

  app.patch("/api/auth/me", requireAuth, (req: AuthRequest, res) => {
    const user = storage.updateUser(req.userId!, req.body);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ user: sanitizeUser(user) });
  });

  // ========== PHONE SETUP ROUTES ==========

  // Setup hosted number (text-enable existing landline/VoIP)
  app.post("/api/phone/setup-hosted", requireAuth, (req: AuthRequest, res) => {
    try {
      const { phoneNumber } = req.body;
      if (!phoneNumber) return res.status(400).json({ error: "Phone number is required" });
      // Validate US E.164 format
      const digits = phoneNumber.replace(/\D/g, '');
      let e164 = '';
      if (digits.length === 10) e164 = `+1${digits}`;
      else if (digits.length === 11 && digits.startsWith('1')) e164 = `+${digits}`;
      else if (phoneNumber.startsWith('+1') && digits.length === 11) e164 = `+${digits}`;
      else return res.status(400).json({ error: "Please enter a valid US phone number" });

      // In production, this would call Twilio's Hosted Numbers API
      // For now: store the number and set status to 'verifying'
      const user = storage.updateUser(req.userId!, {
        phoneSetupType: 'hosted',
        businessPhone: e164,
        twilioPhoneSid: null,
        phoneSetupStatus: 'verifying',
        smsEnabled: false, // not yet active
      });
      if (!user) return res.status(404).json({ error: "User not found" });

      // Also update the twilio_phone setting for compatibility with existing comms
      storage.upsertSetting('twilio_phone_number', e164);
      storage.upsertSetting('twilio_phone', e164);

      res.json({
        status: 'verifying',
        phoneNumber: e164,
        message: "We're text-enabling your number. This typically takes 1-3 business days.",
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Provision a new local number
  app.post("/api/phone/provision-new", requireAuth, (req: AuthRequest, res) => {
    try {
      const { areaCode } = req.body;
      const ac = areaCode && /^\d{3}$/.test(areaCode) ? areaCode : '512';
      // Generate a realistic local number
      const lastSeven = String(Math.floor(1000000 + Math.random() * 9000000));
      const e164 = `+1${ac}${lastSeven}`;
      const formatted = `(${ac}) ${lastSeven.slice(0, 3)}-${lastSeven.slice(3)}`;

      const user = storage.updateUser(req.userId!, {
        phoneSetupType: 'provisioned',
        businessPhone: e164,
        twilioPhoneSid: `PN${Date.now()}`,
        phoneSetupStatus: 'active',
        smsEnabled: true,
      });
      if (!user) return res.status(404).json({ error: "User not found" });

      // Also update settings for compatibility
      storage.upsertSetting('twilio_phone_number', e164);
      storage.upsertSetting('twilio_phone', e164);
      storage.upsertSetting('sms_enabled', 'true');

      res.json({
        phoneNumber: e164,
        formatted,
        status: 'active',
        message: `Your new business line is ${formatted}. Start sharing it with clients!`,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Skip phone setup
  app.post("/api/phone/skip", requireAuth, (req: AuthRequest, res) => {
    storage.updateUser(req.userId!, {
      phoneSetupType: null,
      businessPhone: null,
      phoneSetupStatus: null,
      smsEnabled: false,
    });
    res.json({ status: 'skipped' });
  });

  // Get phone setup status
  app.get("/api/phone/status", requireAuth, (req: AuthRequest, res) => {
    const user = storage.getUserById(req.userId!);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({
      phoneSetupType: user.phoneSetupType,
      businessPhone: user.businessPhone,
      twilioPhoneSid: user.twilioPhoneSid,
      phoneSetupStatus: user.phoneSetupStatus,
      smsEnabled: user.smsEnabled,
    });
  });

  // Test SMS via phone setup
  app.post("/api/phone/test-sms", requireAuth, async (req: AuthRequest, res) => {
    try {
      const { to } = req.body;
      const user = storage.getUserById(req.userId!);
      if (!user) return res.status(404).json({ error: "User not found" });
      if (!user.businessPhone || !user.smsEnabled) {
        return res.status(400).json({ error: "Business phone is not set up or SMS is not enabled" });
      }
      if (!to) return res.status(400).json({ error: "Provide a 'to' phone number" });
      const success = await sendSMS(user.businessPhone, to, `This is a test from DetailFlow! Your SMS integration is working.`);
      res.json({ success, message: success ? 'Test SMS sent!' : 'Failed to send test SMS' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Update AI auto-reply settings
  app.patch("/api/phone/ai-settings", requireAuth, (req: AuthRequest, res) => {
    const { aiAutoReply, aiAutoPrice, aiAutoSchedule, aiReplyStyle } = req.body;
    const updates: any = {};
    if (typeof aiAutoReply === 'boolean') updates.aiAutoReply = aiAutoReply;
    if (typeof aiAutoPrice === 'boolean') updates.aiAutoPrice = aiAutoPrice;
    if (typeof aiAutoSchedule === 'boolean') updates.aiAutoSchedule = aiAutoSchedule;
    if (aiReplyStyle && ['professional', 'casual', 'direct'].includes(aiReplyStyle)) updates.aiReplyStyle = aiReplyStyle;
    const user = storage.updateUser(req.userId!, updates);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({
      aiAutoReply: user.aiAutoReply,
      aiAutoPrice: user.aiAutoPrice,
      aiAutoSchedule: user.aiAutoSchedule,
      aiReplyStyle: user.aiReplyStyle,
    });
  });

  // ========== PROTECTED ROUTES ==========

  // Dashboard
  app.get("/api/dashboard", requireAuth, (req: AuthRequest, res) => {
    const stats = storage.getDashboardStats(req.userId!);
    res.json(stats);
  });

  // Clients
  app.get("/api/clients", requireAuth, (req: AuthRequest, res) => {
    const q = req.query.q as string | undefined;
    if (q) {
      res.json(storage.searchClients(req.userId!, q));
    } else {
      res.json(storage.getClients(req.userId!));
    }
  });

  // Client count (must be before :id route)
  app.get("/api/clients/count", requireAuth, (req: AuthRequest, res) => {
    res.json({ count: storage.getClientCount(req.userId!) });
  });

  app.get("/api/clients/:id", requireAuth, (req: AuthRequest, res) => {
    const client = storage.getClient(req.userId!, Number(req.params.id));
    if (!client) return res.status(404).json({ message: "Client not found" });
    res.json(client);
  });

  app.post("/api/clients", requireAuth, (req: AuthRequest, res) => {
    const parsed = insertClientSchema.safeParse({ ...req.body, userId: req.userId });
    if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
    const client = storage.createClient(parsed.data);
    res.status(201).json(client);
  });

  app.patch("/api/clients/:id", requireAuth, (req: AuthRequest, res) => {
    const client = storage.updateClient(req.userId!, Number(req.params.id), req.body);
    if (!client) return res.status(404).json({ message: "Client not found" });
    res.json(client);
  });

  // Bulk import clients
  app.post("/api/clients/bulk", requireAuth, (req: AuthRequest, res) => {
    try {
      const { clients: clientsData } = req.body;
      if (!Array.isArray(clientsData)) {
        return res.status(400).json({ message: "Expected array of clients" });
      }
      const toInsert = clientsData.map((c: any) => ({
        userId: req.userId!,
        name: c.name || "New Lead",
        email: c.email || "",
        phone: c.phone || "",
        address: c.address || null,
        notes: c.notes || null,
        isLead: false,
        createdAt: new Date().toISOString(),
      }));
      const inserted = storage.createClientsBulk(toInsert);
      res.status(201).json({ count: inserted.length, clients: inserted });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // Vehicles
  app.get("/api/vehicles", requireAuth, (req: AuthRequest, res) => {
    res.json(storage.getVehicles(req.userId!));
  });

  app.get("/api/clients/:clientId/vehicles", requireAuth, (req: AuthRequest, res) => {
    res.json(storage.getVehiclesByClient(req.userId!, Number(req.params.clientId)));
  });

  app.get("/api/vehicles/:id", requireAuth, (req: AuthRequest, res) => {
    const v = storage.getVehicle(req.userId!, Number(req.params.id));
    if (!v) return res.status(404).json({ message: "Vehicle not found" });
    res.json(v);
  });

  app.post("/api/vehicles", requireAuth, (req: AuthRequest, res) => {
    const parsed = insertVehicleSchema.safeParse({ ...req.body, userId: req.userId });
    if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
    const v = storage.createVehicle(parsed.data);
    res.status(201).json(v);
  });

  // Services
  app.get("/api/services", requireAuth, (req: AuthRequest, res) => {
    res.json(storage.getServices(req.userId!));
  });

  app.get("/api/services/:id", requireAuth, (req: AuthRequest, res) => {
    const s = storage.getService(req.userId!, Number(req.params.id));
    if (!s) return res.status(404).json({ message: "Service not found" });
    res.json(s);
  });

  app.patch("/api/services/:id", requireAuth, (req: AuthRequest, res) => {
    const s = storage.updateService(req.userId!, Number(req.params.id), req.body);
    if (!s) return res.status(404).json({ message: "Service not found" });
    res.json(s);
  });

  // Appointments
  app.get("/api/appointments", requireAuth, (req: AuthRequest, res) => {
    const { start, end } = req.query;
    if (start && end) {
      res.json(storage.getAppointmentsByDateRange(req.userId!, start as string, end as string));
    } else {
      res.json(storage.getAppointments(req.userId!));
    }
  });

  app.get("/api/appointments/upcoming", requireAuth, (req: AuthRequest, res) => {
    const limit = Number(req.query.limit) || 5;
    res.json(storage.getUpcomingAppointments(req.userId!, limit));
  });

  app.get("/api/appointments/:id", requireAuth, (req: AuthRequest, res) => {
    const a = storage.getAppointment(req.userId!, Number(req.params.id));
    if (!a) return res.status(404).json({ message: "Appointment not found" });
    res.json(a);
  });

  app.post("/api/appointments", requireAuth, async (req: AuthRequest, res) => {
    const parsed = insertAppointmentSchema.safeParse({ ...req.body, userId: req.userId });
    if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
    const a = storage.createAppointment(parsed.data);

    // Trigger booking confirmation automation
    try {
      const autoConfirm = storage.getSetting("auto_booking_confirmation")?.value === "true";
      if (autoConfirm) {
        const comms = getCommsSettings();
        const client = storage.getClient(req.userId!, a.clientId);
        const svcs = storage.getServices(req.userId!);
        const svcIds: number[] = JSON.parse(a.serviceIds);
        const svcNames = svcIds.map(id => svcs.find(s => s.id === id)?.name || "Service").join(", ");
        const aptDate = new Date(a.scheduledAt);
        if (client) {
          const result = await sendBookingConfirmation({
            clientName: client.name,
            clientPhone: client.phone,
            clientEmail: client.email,
            businessName: comms.fromName,
            appointmentDate: aptDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }),
            appointmentTime: aptDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
            services: svcNames,
            twilioNumber: comms.twilioPhone,
            fromEmail: comms.fromEmail,
            smsEnabled: comms.smsEnabled,
            emailEnabled: comms.emailEnabled,
          });
          console.log("Booking confirmation sent:", result);
        }
      }
    } catch (err) {
      console.error("Booking confirmation automation error:", err);
    }

    res.status(201).json(a);
  });

  app.patch("/api/appointments/:id", requireAuth, async (req: AuthRequest, res) => {
    const a = storage.updateAppointment(req.userId!, Number(req.params.id), req.body);
    if (!a) return res.status(404).json({ message: "Appointment not found" });

    // Trigger post-service follow-up when marked complete
    if (req.body.status === "complete") {
      try {
        const autoFollowup = storage.getSetting("auto_followup")?.value === "true";
        if (autoFollowup) {
          const comms = getCommsSettings();
          const client = storage.getClient(req.userId!, a.clientId);
          const svcs = storage.getServices(req.userId!);
          const svcIds: number[] = JSON.parse(a.serviceIds);
          const svcNames = svcIds.map(id => svcs.find(s => s.id === id)?.name || "Service").join(", ");
          if (client) {
            const result = await sendPostServiceFollowup({
              clientName: client.name,
              clientPhone: client.phone,
              clientEmail: client.email,
              businessName: comms.fromName,
              services: svcNames,
              twilioNumber: comms.twilioPhone,
              fromEmail: comms.fromEmail,
              smsEnabled: comms.smsEnabled,
              emailEnabled: comms.emailEnabled,
            });
            console.log("Post-service follow-up sent:", result);
          }
        }
      } catch (err) {
        console.error("Post-service follow-up automation error:", err);
      }
    }

    res.json(a);
  });

  // Suggested scheduling slots
  app.post("/api/appointments/suggest", requireAuth, (req: AuthRequest, res) => {
    try {
      const { serviceIds } = req.body;
      const allAppointments = storage.getAppointments(req.userId!);
      const allServices = storage.getServices(req.userId!);
      const svcIdArr = Array.isArray(serviceIds) ? serviceIds : [];
      const slots = getSuggestedSlots(allAppointments, allServices, svcIdArr);
      res.json({ slots });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // Quotes
  app.get("/api/quotes", requireAuth, (req: AuthRequest, res) => {
    res.json(storage.getQuotes(req.userId!));
  });

  app.get("/api/quotes/:id", requireAuth, (req: AuthRequest, res) => {
    const q = storage.getQuote(req.userId!, Number(req.params.id));
    if (!q) return res.status(404).json({ message: "Quote not found" });
    res.json(q);
  });

  app.post("/api/quotes", requireAuth, (req: AuthRequest, res) => {
    const parsed = insertQuoteSchema.safeParse({ ...req.body, userId: req.userId });
    if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
    const q = storage.createQuote(parsed.data);
    res.status(201).json(q);
  });

  app.patch("/api/quotes/:id", requireAuth, async (req: AuthRequest, res) => {
    const q = storage.updateQuote(req.userId!, Number(req.params.id), req.body);
    if (!q) return res.status(404).json({ message: "Quote not found" });

    // Send quote email when status changes to "sent"
    if (req.body.status === "sent") {
      try {
        const comms = getCommsSettings();
        if (comms.emailEnabled && comms.fromEmail) {
          const client = storage.getClient(req.userId!, q.clientId);
          if (client && client.email) {
            const lineItems = JSON.parse(q.lineItems) as Array<{ serviceName: string; price: number }>;
            await sendQuoteEmail({
              clientName: client.name,
              clientEmail: client.email,
              businessName: comms.fromName,
              lineItems,
              total: q.total,
              fromEmail: comms.fromEmail,
              fromName: comms.fromName,
            });
            console.log("Quote email sent to", client.email);
          }
        }
      } catch (err) {
        console.error("Quote email automation error:", err);
      }
    }

    res.json(q);
  });

  // Messages
  app.get("/api/messages", requireAuth, (req: AuthRequest, res) => {
    res.json(storage.getMessages(req.userId!));
  });

  app.get("/api/clients/:clientId/messages", requireAuth, (req: AuthRequest, res) => {
    res.json(storage.getMessagesByClient(req.userId!, Number(req.params.clientId)));
  });

  app.post("/api/messages", requireAuth, (req: AuthRequest, res) => {
    const parsed = insertMessageSchema.safeParse({ ...req.body, userId: req.userId });
    if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
    const m = storage.createMessage(parsed.data);
    res.status(201).json(m);
  });

  // ===== LIVE SEND: SMS + EMAIL =====
  function getCommsSettings(): {
    smsEnabled: boolean;
    emailEnabled: boolean;
    twilioPhone: string;
    fromEmail: string;
    fromName: string;
  } {
    const smsEnabled = storage.getSetting("sms_enabled")?.value === "true";
    const emailEnabled = storage.getSetting("email_enabled")?.value === "true";
    const twilioPhone = storage.getSetting("twilio_phone_number")?.value || "";
    const fromEmail = storage.getSetting("from_email")?.value || "";
    const fromName = storage.getSetting("from_name")?.value || "DetailFlow";
    return { smsEnabled, emailEnabled, twilioPhone, fromEmail, fromName };
  }

  // Send a message (real SMS or email)
  app.post("/api/messages/send", requireAuth, async (req: AuthRequest, res) => {
    try {
      const { clientId, content, channel } = req.body;
      if (!clientId || !content || !channel) {
        return res.status(400).json({ message: "clientId, content, and channel are required" });
      }
      const client = storage.getClient(req.userId!, clientId);
      if (!client) return res.status(404).json({ message: "Client not found" });

      const comms = getCommsSettings();
      let delivered = false;
      let deliveryError: string | null = null;

      if (channel === "sms") {
        if (!comms.smsEnabled) {
          deliveryError = "SMS is not enabled. Go to Settings to enable it.";
        } else if (!comms.twilioPhone) {
          deliveryError = "No Twilio phone number configured. Go to Settings to add one.";
        } else if (!client.phone) {
          deliveryError = "Client has no phone number on file.";
        } else {
          delivered = await sendSMS(comms.twilioPhone, client.phone, content);
          if (!delivered) deliveryError = "SMS delivery failed. Check your Twilio configuration.";
        }
      } else if (channel === "email") {
        if (!comms.emailEnabled) {
          deliveryError = "Email is not enabled. Go to Settings to enable it.";
        } else if (!comms.fromEmail) {
          deliveryError = "No sender email configured. Go to Settings to add one.";
        } else if (!client.email) {
          deliveryError = "Client has no email address on file.";
        } else {
          delivered = await sendEmail({
            fromEmail: comms.fromEmail,
            fromName: comms.fromName,
            toEmail: client.email,
            toName: client.name,
            subject: `Message from ${comms.fromName}`,
            content: content,
          });
          if (!delivered) deliveryError = "Email delivery failed. Check your SendGrid configuration.";
        }
      }

      // Always store the message in the database
      const m = storage.createMessage({
        userId: req.userId!,
        clientId,
        content,
        direction: "outbound",
        channel,
        sentAt: new Date().toISOString(),
        aiDraft: null,
      });

      res.status(201).json({
        ...m,
        delivered,
        deliveryError,
      });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // Test SMS
  app.post("/api/test/sms", requireAuth, async (req: AuthRequest, res) => {
    try {
      const { to } = req.body;
      const comms = getCommsSettings();
      if (!comms.twilioPhone) {
        return res.status(400).json({ message: "No Twilio phone number configured" });
      }
      if (!to) {
        return res.status(400).json({ message: "Provide a 'to' phone number" });
      }
      const success = await sendSMS(
        comms.twilioPhone,
        to,
        `Test message from DetailFlow! Your SMS integration is working.`
      );
      res.json({ success, message: success ? "Test SMS sent!" : "Failed to send test SMS" });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // Test Email
  app.post("/api/test/email", requireAuth, async (req: AuthRequest, res) => {
    try {
      const { to } = req.body;
      const comms = getCommsSettings();
      if (!comms.fromEmail) {
        return res.status(400).json({ message: "No sender email configured" });
      }
      if (!to) {
        return res.status(400).json({ message: "Provide a 'to' email address" });
      }
      const success = await sendEmail({
        fromEmail: comms.fromEmail,
        fromName: comms.fromName,
        toEmail: to,
        subject: "Test Email from DetailFlow",
        content: "<h2>It works!</h2><p>Your DetailFlow email integration is set up and working correctly.</p>",
      });
      res.json({ success, message: success ? "Test email sent!" : "Failed to send test email" });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // AI Draft Reply
  app.post("/api/ai/draft-reply", requireAuth, (req: AuthRequest, res) => {
    try {
      const { clientId, lastMessage, clientName } = req.body;
      const user = storage.getUserById(req.userId!);
      const svcs = storage.getServices(req.userId!);
      const vehiclesList = storage.getVehiclesByClient(req.userId!, clientId || 0);
      const appts = storage.getUpcomingAppointments(req.userId!, 10);
      const draft = generateAiDraft({
        lastMessage: lastMessage || "",
        clientName: clientName || "there",
        services: svcs,
        vehicles: vehiclesList,
        appointments: appts,
        businessName: user?.businessName || undefined,
        style: (user?.aiReplyStyle as ReplyStyle) || 'casual',
      });
      res.json({ draft });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // AI Quote follow-up
  app.post("/api/ai/quote-followup", requireAuth, (req: AuthRequest, res) => {
    try {
      const { clientName, services: svcNames, total, status } = req.body;
      const firstName = (clientName || "").split(" ")[0] || "there";
      let draft = "";
      if (status === "sent") {
        draft = `Hey ${firstName}! I just sent over your quote for ${svcNames || "the services we discussed"} — $${total || 0}. Let me know if you have any questions or want to get on the schedule!`;
      } else if (status === "accepted") {
        const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        const now = new Date();
        const slots: string[] = [];
        for (let i = 1; i <= 5 && slots.length < 2; i++) {
          const d = new Date(now);
          d.setDate(d.getDate() + i);
          if (d.getDay() === 0) continue;
          slots.push(days[d.getDay() - 1] || "Saturday");
        }
        draft = `Great news, ${firstName} — your quote is confirmed! Let's get you scheduled. I have openings ${slots.join(" and ")}. What works?`;
      } else {
        draft = `Hey ${firstName}! Thanks for considering us. If you change your mind or want to adjust anything, just let me know — happy to work with you! 👊`;
      }
      res.json({ draft });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // Settings
  app.get("/api/settings", requireAuth, (_req, res) => {
    res.json(storage.getSettings());
  });

  app.put("/api/settings/:key", requireAuth, (req, res) => {
    const { value } = req.body;
    if (typeof value !== "string") return res.status(400).json({ message: "Value must be a string" });
    const s = storage.upsertSetting(req.params.key, value);
    res.json(s);
  });

  // Stripe checkout — return real payment link URLs
  app.post("/api/stripe/checkout", requireAuth, (req: AuthRequest, res) => {
    const { plan } = req.body as { plan?: string };
    const links: Record<string, string> = {
      pro: 'https://buy.stripe.com/fZucN4cCG2BW8I3clpawo01',
      shop: 'https://buy.stripe.com/bJeaEW0TYccw1fB2KPawo00',
    };
    res.json({ url: links[plan || 'pro'] || links.pro });
  });

  // ========== PUBLIC ROUTES (no auth) ==========

  // Public booking page data
  app.get("/api/public/book/:userId", (req, res) => {
    try {
      const userId = Number(req.params.userId);
      const user = storage.getUserById(userId);
      if (!user) return res.status(404).json({ message: "Business not found" });
      const svcs = storage.getServicesByUser(userId);
      const appts = storage.getAppointments(userId);
      // Get available slots for next 14 days
      const slots = getSuggestedSlots(appts, svcs, svcs.map(s => s.id).slice(0, 1));
      res.json({
        businessName: user.businessName,
        services: svcs.map(s => ({
          id: s.id,
          name: s.name,
          category: s.category,
          sedanPrice: s.sedanPrice,
          suvPrice: s.suvPrice,
          vanPrice: s.vanPrice,
          isFlat: s.isFlat,
          flatPrice: s.flatPrice,
          durationMinutes: s.durationMinutes,
        })),
      });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // Public booking submission
  app.post("/api/public/book/:userId", (req, res) => {
    try {
      const userId = Number(req.params.userId);
      const user = storage.getUserById(userId);
      if (!user) return res.status(404).json({ message: "Business not found" });

      const { clientName, clientPhone, clientEmail, vehicleMake, vehicleModel, vehicleYear, vehicleSize, serviceIds, scheduledAt } = req.body;

      if (!clientName || !clientPhone) {
        return res.status(400).json({ message: "Name and phone are required" });
      }

      // Create or find client
      let client = storage.getClientByPhone(userId, clientPhone);
      if (!client) {
        client = storage.createClient({
          userId,
          name: clientName,
          email: clientEmail || "",
          phone: clientPhone,
          address: null,
          notes: "Booked online",
          isLead: false,
          createdAt: new Date().toISOString(),
        });
      }

      // Create vehicle if provided
      let vehicle;
      if (vehicleMake && vehicleModel) {
        vehicle = storage.createVehicle({
          userId,
          clientId: client.id,
          make: vehicleMake,
          model: vehicleModel,
          year: vehicleYear || new Date().getFullYear(),
          color: "—",
          size: vehicleSize || "sedan",
        });
      }

      // Create quote
      const svcs = storage.getServices(userId);
      const svcIdArr = Array.isArray(serviceIds) ? serviceIds : [];
      const lineItems = svcIdArr.map((id: number) => {
        const svc = svcs.find(s => s.id === id);
        if (!svc) return null;
        const size = (vehicleSize || "sedan") as "sedan" | "suv" | "van";
        const price = svc.isFlat ? (svc.flatPrice || 0) : (size === "sedan" ? svc.sedanPrice : size === "suv" ? svc.suvPrice : svc.vanPrice) || 0;
        return { serviceId: svc.id, serviceName: svc.name, price };
      }).filter(Boolean);
      const total = lineItems.reduce((sum: number, li: any) => sum + (li?.price || 0), 0);

      let quote;
      if (lineItems.length > 0 && vehicle) {
        quote = storage.createQuote({
          userId,
          clientId: client.id,
          vehicleId: vehicle.id,
          lineItems: JSON.stringify(lineItems),
          total,
          status: "sent",
          createdAt: new Date().toISOString(),
        });
      }

      // Create appointment if time selected
      if (scheduledAt && vehicle && svcIdArr.length > 0) {
        storage.createAppointment({
          userId,
          clientId: client.id,
          vehicleId: vehicle.id,
          serviceIds: JSON.stringify(svcIdArr),
          scheduledAt,
          status: "scheduled",
          notes: "Booked online",
        });
      }

      // Add a message
      storage.createMessage({
        userId,
        clientId: client.id,
        content: `New online booking from ${clientName}! Services: ${lineItems.map((li: any) => li.serviceName).join(", ")}. Total: $${total}`,
        direction: "inbound",
        channel: "web",
        sentAt: new Date().toISOString(),
        aiDraft: null,
      });

      res.status(201).json({ success: true, clientId: client.id, quoteId: quote?.id });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // Twilio webhook (public, no auth) — enhanced with AI auto-reply
  app.post("/api/webhooks/twilio/incoming", async (req, res) => {
    try {
      const { From, Body, To } = req.body;
      if (!From || !Body) {
        return res.status(400).send("<Response></Response>");
      }

      // Find user by business phone (new system) or legacy twilioPhone
      let matchedUser = storage.getUserByBusinessPhone(To);
      if (!matchedUser) {
        const allUsers = storage.getAllUsers();
        matchedUser = allUsers.find((u: any) => u.twilioPhone === To);
        if (!matchedUser && allUsers.length > 0) {
          matchedUser = allUsers[0]; // fallback to first user
        }
      }
      if (!matchedUser) {
        return res.status(200).type("text/xml").send("<Response></Response>");
      }

      const userId = matchedUser.id;
      const phone = From.replace(/[^\d+]/g, "");
      let isNewLead = false;

      // Check if client exists
      let client = storage.getClientByPhone(userId, phone);
      if (!client) {
        // Create new lead
        if (matchedUser.autoCreateLeads) {
          isNewLead = true;
          client = storage.createClient({
            userId,
            name: "New Lead",
            email: "",
            phone,
            address: null,
            notes: null,
            isLead: true,
            createdAt: new Date().toISOString(),
          });
        } else {
          return res.status(200).type("text/xml").send("<Response></Response>");
        }
      }

      // Generate AI draft
      const svcs = storage.getServices(userId);
      const vehiclesList = storage.getVehiclesByClient(userId, client.id);
      const appts = storage.getUpcomingAppointments(userId, 10);

      const draft = generateAiDraft({
        lastMessage: Body,
        clientName: client.name,
        services: svcs,
        vehicles: vehiclesList,
        appointments: appts,
        businessName: matchedUser.businessName || undefined,
        style: (matchedUser.aiReplyStyle as ReplyStyle) || 'casual',
        isFirstContact: isNewLead,
      });

      // Store inbound message
      storage.createMessage({
        userId,
        clientId: client.id,
        content: Body,
        direction: "inbound",
        channel: "sms",
        sentAt: new Date().toISOString(),
        aiDraft: draft,
        aiGenerated: false,
      });

      // AI Auto-Reply: if enabled, send the draft as a real SMS
      if (matchedUser.aiAutoReply && matchedUser.smsEnabled && matchedUser.businessPhone) {
        const sent = await sendSMS(matchedUser.businessPhone, phone, draft);
        if (sent) {
          storage.createMessage({
            userId,
            clientId: client.id,
            content: draft,
            direction: "outbound",
            channel: "sms",
            sentAt: new Date().toISOString(),
            aiDraft: null,
            aiGenerated: true,
          });
          console.log(`AI auto-reply sent to ${phone}: ${draft.substring(0, 60)}...`);
        }
      }

      // Return empty TwiML — we handle replies ourselves
      res.status(200).type("text/xml").send("<Response></Response>");
    } catch (err: any) {
      console.error('Webhook error:', err);
      res.status(200).type("text/xml").send("<Response></Response>");
    }
  });

  // ========== IMPORT ROUTES ==========

  // Helper: normalize phone to digits only
  function normalizePhone(phone: string): string {
    let digits = phone.replace(/\D/g, "");
    if (digits.length === 11 && digits.startsWith("1")) digits = digits.slice(1);
    return digits;
  }

  // Helper: format phone for display
  function formatImportPhone(digits: string): string {
    if (digits.length === 10) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    }
    return digits;
  }

  // Helper: parse a single text line into name/phone/email
  function parseContactLine(line: string): { name: string; phone: string; email: string } {
    const trimmed = line.trim();
    if (!trimmed) return { name: "", phone: "", email: "" };

    const phoneRegex = /(?:\+?1[-\.\s]?)?\(?\d{3}\)?[-\.\s]?\d{3}[-\.\s]?\d{4}/;
    const emailRegex = /[\w.+-]+@[\w.-]+\.\w+/;

    let phone = "";
    let email = "";
    let remaining = trimmed;

    const phoneMatch = remaining.match(phoneRegex);
    if (phoneMatch) {
      const digits = normalizePhone(phoneMatch[0]);
      if (digits.length === 10) {
        phone = formatImportPhone(digits);
      }
      remaining = remaining.replace(phoneMatch[0], "");
    }

    const emailMatch = remaining.match(emailRegex);
    if (emailMatch) {
      email = emailMatch[0];
      remaining = remaining.replace(emailMatch[0], "");
    }

    let name = remaining.replace(/[,;|\t]+/g, " ").replace(/\s+/g, " ").trim();
    if (!name && phone) name = "New Lead";

    return { name, phone, email };
  }

  // Helper: parse vCard text into contacts array
  function parseVCards(text: string): Array<{ name: string; phone: string; email: string; address: string }> {
    const cards: Array<{ name: string; phone: string; email: string; address: string }> = [];
    const blocks = text.split(/BEGIN:VCARD/i).filter(b => b.trim());

    for (const block of blocks) {
      const lines = block.split(/\r?\n/);
      let name = "";
      let phones: { type: string; number: string }[] = [];
      let email = "";
      let address = "";

      for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line || line.startsWith("END:VCARD") || line.startsWith("VERSION:")) continue;

        // Full name
        if (line.toUpperCase().startsWith("FN")) {
          const colonIdx = line.indexOf(":");
          if (colonIdx !== -1) name = line.slice(colonIdx + 1).trim();
        }

        // Phone
        if (line.toUpperCase().startsWith("TEL")) {
          const colonIdx = line.indexOf(":");
          if (colonIdx !== -1) {
            const number = line.slice(colonIdx + 1).trim();
            const upper = line.toUpperCase();
            let type = "other";
            if (upper.includes("CELL") || upper.includes("MOBILE")) type = "cell";
            else if (upper.includes("HOME")) type = "home";
            else if (upper.includes("WORK")) type = "work";
            phones.push({ type, number });
          }
        }

        // Email
        if (line.toUpperCase().startsWith("EMAIL") && !email) {
          const colonIdx = line.indexOf(":");
          if (colonIdx !== -1) email = line.slice(colonIdx + 1).trim();
        }

        // Address
        if (line.toUpperCase().startsWith("ADR")) {
          const colonIdx = line.indexOf(":");
          if (colonIdx !== -1) {
            const parts = line.slice(colonIdx + 1).split(";").filter(Boolean).map(s => s.trim());
            address = parts.join(", ");
          }
        }
      }

      // Pick best phone: prefer cell, then home, then work, then first
      let bestPhone = "";
      const cellPhone = phones.find(p => p.type === "cell");
      if (cellPhone) {
        bestPhone = cellPhone.number;
      } else if (phones.length > 0) {
        bestPhone = phones[0].number;
      }

      // Normalize phone
      const digits = normalizePhone(bestPhone);
      const formattedPhone = digits.length === 10 ? formatImportPhone(digits) : bestPhone;

      // Skip contacts with no phone AND no email
      if (!formattedPhone && !email) continue;
      if (!name) name = "New Lead";

      cards.push({ name, phone: formattedPhone, email, address });
    }

    return cards;
  }

  // POST /api/clients/import-csv - Upload and import CSV/Excel file
  app.post("/api/clients/import-csv", requireAuth, upload.single("file"), (req: AuthRequest, res) => {
    try {
      if (!req.file) return res.status(400).json({ error: "No file uploaded" });

      const mappingStr = req.body?.mapping;
      if (!mappingStr) return res.status(400).json({ error: "No column mapping provided" });

      let mapping: Record<string, string>;
      try {
        mapping = JSON.parse(mappingStr);
      } catch {
        return res.status(400).json({ error: "Invalid column mapping JSON" });
      }

      // Parse the file
      let rows: Record<string, string>[] = [];
      const fileName = req.file.originalname?.toLowerCase() || "";

      if (fileName.endsWith(".csv") || fileName.endsWith(".tsv") || fileName.endsWith(".txt")) {
        // Parse CSV/TSV as text
        const text = req.file.buffer.toString("utf-8");
        const delimiter = fileName.endsWith(".tsv") ? "\t" : ",";
        const lines = text.split(/\r?\n/).filter(l => l.trim());
        if (lines.length < 2) return res.status(400).json({ error: "File has no data rows" });

        // Simple CSV parser that handles quoted fields
        function parseCSVLine(line: string, delim: string): string[] {
          const result: string[] = [];
          let current = "";
          let inQuotes = false;
          for (let i = 0; i < line.length; i++) {
            const ch = line[i];
            if (inQuotes) {
              if (ch === '"' && line[i + 1] === '"') { current += '"'; i++; }
              else if (ch === '"') inQuotes = false;
              else current += ch;
            } else {
              if (ch === '"') inQuotes = true;
              else if (ch === delim) { result.push(current.trim()); current = ""; }
              else current += ch;
            }
          }
          result.push(current.trim());
          return result;
        }

        const headers = parseCSVLine(lines[0], delimiter);
        for (let i = 1; i < lines.length; i++) {
          const values = parseCSVLine(lines[i], delimiter);
          const row: Record<string, string> = {};
          headers.forEach((h, idx) => { row[h] = values[idx] || ""; });
          rows.push(row);
        }
      } else {
        // Parse Excel with xlsx
        const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
        const sheetName = workbook.SheetNames[0];
        if (!sheetName) return res.status(400).json({ error: "Workbook has no sheets" });
        rows = XLSX.utils.sheet_to_json<Record<string, string>>(workbook.Sheets[sheetName], { defval: "" });
      }

      if (rows.length === 0) return res.status(400).json({ error: "No data rows found" });
      if (rows.length > 1000) return res.status(400).json({ error: "Maximum 1000 contacts per import" });

      // Apply mapping to extract contact data
      const contacts: Array<{ name: string; phone: string; email: string; address: string; vehicleMake: string; vehicleModel: string; vehicleYear: string }> = [];

      for (const row of rows) {
        let firstName = "";
        let lastName = "";
        let fullName = "";
        let phone = "";
        let email = "";
        let address = "";
        let vehicleMake = "";
        let vehicleModel = "";
        let vehicleYear = "";

        for (const [col, target] of Object.entries(mapping)) {
          const val = (row[col] || "").toString().trim();
          if (!val) continue;
          switch (target) {
            case "name": fullName = val; break;
            case "first_name": firstName = val; break;
            case "last_name": lastName = val; break;
            case "phone": {
              const digits = normalizePhone(val);
              phone = digits.length === 10 ? formatImportPhone(digits) : val;
              break;
            }
            case "email": email = val; break;
            case "address": address = val; break;
            case "vehicle_make": vehicleMake = val; break;
            case "vehicle_model": vehicleModel = val; break;
            case "vehicle_year": vehicleYear = val; break;
          }
        }

        // Build name
        let name = fullName;
        if (!name && (firstName || lastName)) {
          name = [firstName, lastName].filter(Boolean).join(" ");
        }
        if (!name) name = "New Lead";

        // Skip rows with no useful data
        if (name === "New Lead" && !phone && !email) continue;

        contacts.push({ name, phone, email, address, vehicleMake, vehicleModel, vehicleYear });
      }

      // Deduplicate against existing clients by phone
      const allPhones = contacts.map(c => normalizePhone(c.phone)).filter(Boolean);
      const existingClients = storage.getClientsByPhones(req.userId!, allPhones);
      const existingPhones = new Set(existingClients.map(c => normalizePhone(c.phone)));

      let imported = 0;
      let duplicates = 0;
      let errors = 0;

      for (const contact of contacts) {
        try {
          const digits = normalizePhone(contact.phone);
          if (digits && existingPhones.has(digits)) {
            duplicates++;
            continue;
          }

          const client = storage.createClient({
            userId: req.userId!,
            name: contact.name,
            email: contact.email,
            phone: contact.phone,
            address: contact.address || null,
            notes: null,
            isLead: false,
            createdAt: new Date().toISOString(),
          });

          // Create vehicle if make/model provided
          if (contact.vehicleMake && contact.vehicleModel) {
            storage.createVehicle({
              userId: req.userId!,
              clientId: client.id,
              make: contact.vehicleMake,
              model: contact.vehicleModel,
              year: parseInt(contact.vehicleYear) || new Date().getFullYear(),
              color: "",
              size: "sedan",
            });
          }

          // Add to set so we don't import duplicates within the file
          if (digits) existingPhones.add(digits);
          imported++;
        } catch {
          errors++;
        }
      }

      res.json({ imported, duplicates, errors });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Import failed" });
    }
  });

  // POST /api/clients/import-vcf - Parse and import vCard (.vcf) file
  app.post("/api/clients/import-vcf", requireAuth, upload.single("file"), (req: AuthRequest, res) => {
    try {
      if (!req.file) return res.status(400).json({ error: "No file uploaded" });

      const text = req.file.buffer.toString("utf-8");
      const contacts = parseVCards(text);

      if (contacts.length > 1000) {
        return res.status(400).json({ error: "Maximum 1000 contacts per import. Your file has " + contacts.length + " contacts." });
      }

      // If action is "preview", return parsed contacts without importing
      const action = req.body?.action || "preview";
      if (action === "preview") {
        return res.json({ contacts });
      }

      // Import selected contacts
      let selectedIndices: number[] | null = null;
      if (req.body?.selectedIndices) {
        try {
          selectedIndices = JSON.parse(req.body.selectedIndices);
        } catch {}
      }

      const toImport = selectedIndices
        ? contacts.filter((_, i) => selectedIndices!.includes(i))
        : contacts;

      // Deduplicate against existing clients by phone
      const allPhones = toImport.map(c => normalizePhone(c.phone)).filter(Boolean);
      const existingClients = storage.getClientsByPhones(req.userId!, allPhones);
      const existingPhones = new Set(existingClients.map(c => normalizePhone(c.phone)));

      let imported = 0;
      let duplicates = 0;

      for (const contact of toImport) {
        const digits = normalizePhone(contact.phone);
        if (digits && existingPhones.has(digits)) {
          duplicates++;
          continue;
        }

        storage.createClient({
          userId: req.userId!,
          name: contact.name,
          email: contact.email,
          phone: contact.phone,
          address: contact.address || null,
          notes: null,
          isLead: false,
          createdAt: new Date().toISOString(),
        });

        if (digits) existingPhones.add(digits);
        imported++;
      }

      res.json({ imported, duplicates, errors: 0 });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Import failed" });
    }
  });

  // POST /api/clients/import-text - Parse pasted text into contacts
  app.post("/api/clients/import-text", requireAuth, (req: AuthRequest, res) => {
    try {
      const { text, action } = req.body;

      // Import action: expects contacts array directly
      if (action === "import") {
        const contactsToImport = req.body.contacts;
        if (!Array.isArray(contactsToImport)) {
          return res.status(400).json({ error: "Expected contacts array for import" });
        }

        // Deduplicate
        const allPhones = contactsToImport.map((c: any) => normalizePhone(c.phone || "")).filter(Boolean);
        const existingClients = storage.getClientsByPhones(req.userId!, allPhones);
        const existingPhones = new Set(existingClients.map(c => normalizePhone(c.phone)));

        let imported = 0;
        let duplicates = 0;

        for (const contact of contactsToImport) {
          const digits = normalizePhone(contact.phone || "");
          if (digits && existingPhones.has(digits)) {
            duplicates++;
            continue;
          }

          storage.createClient({
            userId: req.userId!,
            name: contact.name || "New Lead",
            email: contact.email || "",
            phone: contact.phone || "",
            address: null,
            notes: null,
            isLead: false,
            createdAt: new Date().toISOString(),
          });

          if (digits) existingPhones.add(digits);
          imported++;
        }

        return res.json({ imported, duplicates, errors: 0 });
      }

      // Parse action: parse text lines
      if (!text || typeof text !== "string") {
        return res.status(400).json({ error: "No text provided" });
      }

      const lines = text.split(/\r?\n/).filter(l => l.trim());
      if (lines.length > 1000) {
        return res.status(400).json({ error: "Maximum 1000 contacts per import" });
      }

      const parsed = lines.map(line => parseContactLine(line)).filter(c => c.name || c.phone || c.email);
      return res.json({ contacts: parsed });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Import failed" });
    }
  });

  // POST /api/clients/import-csv/preview - Preview CSV/Excel file columns and rows
  app.post("/api/clients/import-csv/preview", requireAuth, upload.single("file"), (req: AuthRequest, res) => {
    try {
      if (!req.file) return res.status(400).json({ error: "No file uploaded" });

      let rows: Record<string, string>[] = [];
      const fileName = req.file.originalname?.toLowerCase() || "";

      if (fileName.endsWith(".csv") || fileName.endsWith(".tsv") || fileName.endsWith(".txt")) {
        const text = req.file.buffer.toString("utf-8");
        const delimiter = fileName.endsWith(".tsv") ? "\t" : ",";
        const lines = text.split(/\r?\n/).filter(l => l.trim());
        if (lines.length < 2) return res.status(400).json({ error: "File has no data rows" });

        function parseCSVLine(line: string, delim: string): string[] {
          const result: string[] = [];
          let current = "";
          let inQuotes = false;
          for (let i = 0; i < line.length; i++) {
            const ch = line[i];
            if (inQuotes) {
              if (ch === '"' && line[i + 1] === '"') { current += '"'; i++; }
              else if (ch === '"') inQuotes = false;
              else current += ch;
            } else {
              if (ch === '"') inQuotes = true;
              else if (ch === delim) { result.push(current.trim()); current = ""; }
              else current += ch;
            }
          }
          result.push(current.trim());
          return result;
        }

        const headers = parseCSVLine(lines[0], delimiter);
        for (let i = 1; i < Math.min(lines.length, 6); i++) {
          const values = parseCSVLine(lines[i], delimiter);
          const row: Record<string, string> = {};
          headers.forEach((h, idx) => { row[h] = values[idx] || ""; });
          rows.push(row);
        }

        const totalRows = lines.length - 1;
        const headers2 = headers;

        // Auto-detect column mappings
        const autoMapping: Record<string, string> = {};
        for (const h of headers2) {
          const lower = h.toLowerCase().trim();
          if (/^(full\s*)?name$/.test(lower) || lower === "client" || lower === "contact") autoMapping[h] = "name";
          else if (/^first\s*(name)?$/.test(lower)) autoMapping[h] = "first_name";
          else if (/^last\s*(name)?$/.test(lower)) autoMapping[h] = "last_name";
          else if (/phone|mobile|cell|tel/.test(lower)) autoMapping[h] = "phone";
          else if (/e[-]?mail/.test(lower)) autoMapping[h] = "email";
          else if (/address|street|city/.test(lower)) autoMapping[h] = "address";
          else if (/make|brand/.test(lower)) autoMapping[h] = "vehicle_make";
          else if (/model/.test(lower)) autoMapping[h] = "vehicle_model";
          else if (/year/.test(lower)) autoMapping[h] = "vehicle_year";
          else autoMapping[h] = "skip";
        }

        return res.json({ headers: headers2, rows, totalRows, autoMapping });
      } else {
        // Excel
        const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
        const sheetName = workbook.SheetNames[0];
        if (!sheetName) return res.status(400).json({ error: "Workbook has no sheets" });
        const allRows = XLSX.utils.sheet_to_json<Record<string, string>>(workbook.Sheets[sheetName], { defval: "" });
        if (allRows.length === 0) return res.status(400).json({ error: "No data rows found" });

        const headers = Object.keys(allRows[0]);
        rows = allRows.slice(0, 5);

        const autoMapping: Record<string, string> = {};
        for (const h of headers) {
          const lower = h.toLowerCase().trim();
          if (/^(full\s*)?name$/.test(lower) || lower === "client" || lower === "contact") autoMapping[h] = "name";
          else if (/^first\s*(name)?$/.test(lower)) autoMapping[h] = "first_name";
          else if (/^last\s*(name)?$/.test(lower)) autoMapping[h] = "last_name";
          else if (/phone|mobile|cell|tel/.test(lower)) autoMapping[h] = "phone";
          else if (/e[-]?mail/.test(lower)) autoMapping[h] = "email";
          else if (/address|street|city/.test(lower)) autoMapping[h] = "address";
          else if (/make|brand/.test(lower)) autoMapping[h] = "vehicle_make";
          else if (/model/.test(lower)) autoMapping[h] = "vehicle_model";
          else if (/year/.test(lower)) autoMapping[h] = "vehicle_year";
          else autoMapping[h] = "skip";
        }

        return res.json({ headers, rows, totalRows: allRows.length, autoMapping });
      }
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Preview failed" });
    }
  });

  return httpServer;
}
