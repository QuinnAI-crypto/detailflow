import {
  type Client, type InsertClient,
  type Vehicle, type InsertVehicle,
  type Service, type InsertService,
  type Appointment, type InsertAppointment,
  type Quote, type InsertQuote,
  type Message, type InsertMessage,
  type Setting, type InsertSetting,
  type User, type InsertUser,
} from "@shared/schema";
import bcrypt from "bcryptjs";

export interface IStorage {
  // Users
  getUserByEmail(email: string): User | undefined;
  getUserById(id: number): User | undefined;
  getUserByBusinessPhone(phone: string): User | undefined;
  getAllUsers(): User[];
  createUser(data: InsertUser): User;
  updateUser(id: number, data: Partial<InsertUser>): User | undefined;

  // Clients
  getClients(userId: number): Client[];
  getClient(userId: number, id: number): Client | undefined;
  createClient(data: InsertClient): Client;
  createClientsBulk(dataArray: InsertClient[]): Client[];
  updateClient(userId: number, id: number, data: Partial<InsertClient>): Client | undefined;
  searchClients(userId: number, query: string): Client[];
  getClientByPhone(userId: number, phone: string): Client | undefined;
  getNewLeadsCount(userId: number): number;
  getClientCount(userId: number): number;
  getClientsByPhones(userId: number, phones: string[]): Client[];

  // Vehicles
  getVehicles(userId: number): Vehicle[];
  getVehiclesByClient(userId: number, clientId: number): Vehicle[];
  getVehicle(userId: number, id: number): Vehicle | undefined;
  createVehicle(data: InsertVehicle): Vehicle;

  // Services
  getServices(userId: number): Service[];
  getService(userId: number, id: number): Service | undefined;
  getServicesByUser(userId: number): Service[];
  createService(data: InsertService): Service;
  updateService(userId: number, id: number, data: Partial<InsertService>): Service | undefined;

  // Appointments
  getAppointments(userId: number): Appointment[];
  getAppointment(userId: number, id: number): Appointment | undefined;
  getAppointmentsByDateRange(userId: number, start: string, end: string): Appointment[];
  getUpcomingAppointments(userId: number, limit: number): Appointment[];
  createAppointment(data: InsertAppointment): Appointment;
  updateAppointment(userId: number, id: number, data: Partial<InsertAppointment>): Appointment | undefined;

  // Quotes
  getQuotes(userId: number): Quote[];
  getQuote(userId: number, id: number): Quote | undefined;
  createQuote(data: InsertQuote): Quote;
  updateQuote(userId: number, id: number, data: Partial<InsertQuote>): Quote | undefined;

  // Messages
  getMessages(userId: number): Message[];
  getMessagesByClient(userId: number, clientId: number): Message[];
  createMessage(data: InsertMessage): Message;

  // Settings
  getSettings(): Setting[];
  getSetting(key: string): Setting | undefined;
  upsertSetting(key: string, value: string): Setting;

  // Dashboard
  getDashboardStats(userId: number): {
    todayJobs: number;
    todayRevenue: number;
    pendingQuotes: number;
    unreadMessages: number;
    newLeads: number;
  };
}

export class InMemoryStorage implements IStorage {
  private users: Map<number, User> = new Map();
  private clients: Map<number, Client> = new Map();
  private vehicles: Map<number, Vehicle> = new Map();
  private appointments: Map<number, Appointment> = new Map();
  private quotes: Map<number, Quote> = new Map();
  private messages: Map<number, Message> = new Map();
  private services: Map<number, Service> = new Map();
  private settingsMap: Map<number, Setting> = new Map();
  private nextId: Map<string, number> = new Map();

  private getNextId(table: string): number {
    const current = this.nextId.get(table) || 1;
    this.nextId.set(table, current + 1);
    return current;
  }

  constructor() {
    this.seedData();
  }

  // Users
  getUserByEmail(email: string): User | undefined {
    return Array.from(this.users.values()).find(u => u.email === email);
  }
  getUserById(id: number): User | undefined {
    return this.users.get(id);
  }
  getUserByBusinessPhone(phone: string): User | undefined {
    return Array.from(this.users.values()).find(u => u.businessPhone === phone);
  }
  getAllUsers(): User[] {
    return Array.from(this.users.values());
  }
  createUser(data: InsertUser): User {
    const id = this.getNextId("users");
    const user: User = {
      id,
      email: data.email,
      passwordHash: data.passwordHash,
      businessName: data.businessName ?? "",
      phone: data.phone ?? "",
      onboardingComplete: data.onboardingComplete ?? false,
      plan: data.plan ?? "free",
      stripeCustomerId: data.stripeCustomerId ?? null,
      twilioPhone: data.twilioPhone ?? null,
      autoCreateLeads: data.autoCreateLeads ?? true,
      phoneSetupType: data.phoneSetupType ?? null,
      businessPhone: data.businessPhone ?? null,
      twilioPhoneSid: data.twilioPhoneSid ?? null,
      phoneSetupStatus: data.phoneSetupStatus ?? null,
      smsEnabled: data.smsEnabled ?? false,
      aiAutoReply: data.aiAutoReply ?? true,
      aiAutoPrice: data.aiAutoPrice ?? true,
      aiAutoSchedule: data.aiAutoSchedule ?? false,
      aiReplyStyle: data.aiReplyStyle ?? "casual",
      createdAt: data.createdAt ?? new Date(),
    };
    this.users.set(id, user);
    return user;
  }
  updateUser(id: number, data: Partial<InsertUser>): User | undefined {
    const user = this.users.get(id);
    if (!user) return undefined;
    const updated = { ...user, ...data };
    this.users.set(id, updated);
    return updated;
  }

  // Clients
  getClients(userId: number): Client[] {
    return Array.from(this.clients.values())
      .filter(c => c.userId === userId)
      .sort((a, b) => a.name.localeCompare(b.name));
  }
  getClient(userId: number, id: number): Client | undefined {
    const c = this.clients.get(id);
    return c && c.userId === userId ? c : undefined;
  }
  createClient(data: InsertClient): Client {
    const id = this.getNextId("clients");
    const client: Client = {
      id,
      userId: data.userId,
      name: data.name,
      email: data.email ?? "",
      phone: data.phone ?? "",
      address: data.address ?? null,
      notes: data.notes ?? null,
      isLead: data.isLead ?? false,
      createdAt: data.createdAt,
    };
    this.clients.set(id, client);
    return client;
  }
  createClientsBulk(dataArray: InsertClient[]): Client[] {
    return dataArray.map(d => this.createClient(d));
  }
  updateClient(userId: number, id: number, data: Partial<InsertClient>): Client | undefined {
    const client = this.clients.get(id);
    if (!client || client.userId !== userId) return undefined;
    const updated = { ...client, ...data, id, userId };
    this.clients.set(id, updated);
    return updated;
  }
  searchClients(userId: number, query: string): Client[] {
    const q = query.toLowerCase();
    return Array.from(this.clients.values()).filter(c =>
      c.userId === userId && (
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q)
      )
    );
  }
  getClientByPhone(userId: number, phone: string): Client | undefined {
    return Array.from(this.clients.values()).find(c => c.userId === userId && c.phone === phone);
  }
  getNewLeadsCount(userId: number): number {
    return Array.from(this.clients.values()).filter(c => c.userId === userId && c.isLead).length;
  }
  getClientCount(userId: number): number {
    return Array.from(this.clients.values()).filter(c => c.userId === userId).length;
  }
  getClientsByPhones(userId: number, phones: string[]): Client[] {
    if (phones.length === 0) return [];
    return Array.from(this.clients.values()).filter(c => {
      if (c.userId !== userId) return false;
      const normalized = c.phone.replace(/\D/g, "");
      return phones.includes(normalized);
    });
  }

  // Vehicles
  getVehicles(userId: number): Vehicle[] {
    return Array.from(this.vehicles.values()).filter(v => v.userId === userId);
  }
  getVehiclesByClient(userId: number, clientId: number): Vehicle[] {
    return Array.from(this.vehicles.values()).filter(v => v.clientId === clientId && v.userId === userId);
  }
  getVehicle(userId: number, id: number): Vehicle | undefined {
    const v = this.vehicles.get(id);
    return v && v.userId === userId ? v : undefined;
  }
  createVehicle(data: InsertVehicle): Vehicle {
    const id = this.getNextId("vehicles");
    const vehicle: Vehicle = {
      id,
      userId: data.userId,
      clientId: data.clientId,
      make: data.make,
      model: data.model,
      year: data.year,
      color: data.color,
      size: data.size,
    };
    this.vehicles.set(id, vehicle);
    return vehicle;
  }

  // Services
  getServices(userId: number): Service[] {
    return Array.from(this.services.values()).filter(s => s.userId === userId);
  }
  getServicesByUser(userId: number): Service[] {
    return Array.from(this.services.values()).filter(s => s.userId === userId && s.active);
  }
  getService(userId: number, id: number): Service | undefined {
    const s = this.services.get(id);
    return s && s.userId === userId ? s : undefined;
  }
  createService(data: InsertService): Service {
    const id = this.getNextId("services");
    const service: Service = {
      id,
      userId: data.userId,
      name: data.name,
      category: data.category ?? "detailing",
      sedanPrice: data.sedanPrice ?? null,
      suvPrice: data.suvPrice ?? null,
      vanPrice: data.vanPrice ?? null,
      isFlat: data.isFlat ?? false,
      flatPrice: data.flatPrice ?? null,
      durationMinutes: data.durationMinutes ?? 60,
      active: data.active ?? true,
    };
    this.services.set(id, service);
    return service;
  }
  updateService(userId: number, id: number, data: Partial<InsertService>): Service | undefined {
    const service = this.services.get(id);
    if (!service || service.userId !== userId) return undefined;
    const updated = { ...service, ...data, id, userId };
    this.services.set(id, updated);
    return updated;
  }

  // Appointments
  getAppointments(userId: number): Appointment[] {
    return Array.from(this.appointments.values())
      .filter(a => a.userId === userId)
      .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));
  }
  getAppointment(userId: number, id: number): Appointment | undefined {
    const a = this.appointments.get(id);
    return a && a.userId === userId ? a : undefined;
  }
  getAppointmentsByDateRange(userId: number, start: string, end: string): Appointment[] {
    return Array.from(this.appointments.values())
      .filter(a => a.userId === userId && a.scheduledAt >= start && a.scheduledAt <= end)
      .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));
  }
  getUpcomingAppointments(userId: number, limit: number): Appointment[] {
    const now = new Date().toISOString();
    return Array.from(this.appointments.values())
      .filter(a => a.userId === userId && a.scheduledAt >= now)
      .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt))
      .slice(0, limit);
  }
  createAppointment(data: InsertAppointment): Appointment {
    const id = this.getNextId("appointments");
    const appointment: Appointment = {
      id,
      userId: data.userId,
      clientId: data.clientId,
      vehicleId: data.vehicleId,
      serviceIds: data.serviceIds,
      scheduledAt: data.scheduledAt,
      status: data.status ?? "scheduled",
      notes: data.notes ?? null,
    };
    this.appointments.set(id, appointment);
    return appointment;
  }
  updateAppointment(userId: number, id: number, data: Partial<InsertAppointment>): Appointment | undefined {
    const appointment = this.appointments.get(id);
    if (!appointment || appointment.userId !== userId) return undefined;
    const updated = { ...appointment, ...data, id, userId };
    this.appointments.set(id, updated);
    return updated;
  }

  // Quotes
  getQuotes(userId: number): Quote[] {
    return Array.from(this.quotes.values())
      .filter(q => q.userId === userId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  getQuote(userId: number, id: number): Quote | undefined {
    const q = this.quotes.get(id);
    return q && q.userId === userId ? q : undefined;
  }
  createQuote(data: InsertQuote): Quote {
    const id = this.getNextId("quotes");
    const quote: Quote = {
      id,
      userId: data.userId,
      clientId: data.clientId,
      vehicleId: data.vehicleId,
      lineItems: data.lineItems,
      total: data.total,
      status: data.status ?? "draft",
      createdAt: data.createdAt,
    };
    this.quotes.set(id, quote);
    return quote;
  }
  updateQuote(userId: number, id: number, data: Partial<InsertQuote>): Quote | undefined {
    const quote = this.quotes.get(id);
    if (!quote || quote.userId !== userId) return undefined;
    const updated = { ...quote, ...data, id, userId };
    this.quotes.set(id, updated);
    return updated;
  }

  // Messages
  getMessages(userId: number): Message[] {
    return Array.from(this.messages.values())
      .filter(m => m.userId === userId)
      .sort((a, b) => a.sentAt.localeCompare(b.sentAt));
  }
  getMessagesByClient(userId: number, clientId: number): Message[] {
    return Array.from(this.messages.values())
      .filter(m => m.clientId === clientId && m.userId === userId)
      .sort((a, b) => a.sentAt.localeCompare(b.sentAt));
  }
  createMessage(data: InsertMessage): Message {
    const id = this.getNextId("messages");
    const message: Message = {
      id,
      userId: data.userId,
      clientId: data.clientId,
      content: data.content,
      direction: data.direction,
      channel: data.channel,
      sentAt: data.sentAt,
      aiDraft: data.aiDraft ?? null,
      aiGenerated: data.aiGenerated ?? false,
    };
    this.messages.set(id, message);
    return message;
  }

  // Settings
  getSettings(): Setting[] {
    return Array.from(this.settingsMap.values());
  }
  getSetting(key: string): Setting | undefined {
    return Array.from(this.settingsMap.values()).find(s => s.key === key);
  }
  upsertSetting(key: string, value: string): Setting {
    const existing = this.getSetting(key);
    if (existing) {
      const updated = { ...existing, value };
      this.settingsMap.set(existing.id, updated);
      return updated;
    }
    const id = this.getNextId("settings");
    const setting: Setting = { id, key, value };
    this.settingsMap.set(id, setting);
    return setting;
  }

  // Dashboard
  getDashboardStats(userId: number) {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString();

    const todayAppointments = Array.from(this.appointments.values()).filter(a =>
      a.userId === userId && a.scheduledAt >= startOfDay && a.scheduledAt <= endOfDay
    );

    const pendingQuotesList = Array.from(this.quotes.values()).filter(q =>
      q.userId === userId && (q.status === "draft" || q.status === "sent")
    );

    const allMessages = Array.from(this.messages.values()).filter(m =>
      m.userId === userId && m.direction === "inbound"
    );

    let todayRevenue = 0;
    for (const apt of todayAppointments) {
      if (apt.status === "complete") {
        const svcIds: number[] = JSON.parse(apt.serviceIds);
        const vehicle = this.getVehicle(userId, apt.vehicleId);
        for (const svcId of svcIds) {
          const svc = this.getService(userId, svcId);
          if (svc && vehicle) {
            if (svc.isFlat) {
              todayRevenue += svc.flatPrice || 0;
            } else {
              const size = vehicle.size as 'sedan' | 'suv' | 'van';
              if (size === 'sedan') todayRevenue += svc.sedanPrice || 0;
              else if (size === 'suv') todayRevenue += svc.suvPrice || 0;
              else todayRevenue += svc.vanPrice || 0;
            }
          }
        }
      }
    }

    const newLeads = this.getNewLeadsCount(userId);

    return {
      todayJobs: todayAppointments.length,
      todayRevenue,
      pendingQuotes: pendingQuotesList.length,
      unreadMessages: allMessages.length,
      newLeads,
    };
  }

  // Seed data inline so the app is always demo-ready on cold starts
  private seedData() {
    const passwordHash = bcrypt.hashSync("detailflow2026", 10);
    const demoUser = this.createUser({
      email: "demo@detailflow.app",
      passwordHash,
      businessName: "Pristine Auto Detailing",
      phone: "(512) 555-0100",
      onboardingComplete: true,
      plan: "pro",
      stripeCustomerId: null,
      twilioPhone: null,
      autoCreateLeads: true,
    });

    const uid = demoUser.id;

    // Seed all 34 services
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

    const insertedServices: Service[] = [];
    for (const s of DEFAULT_SERVICES) {
      const svc = this.createService({ ...s, userId: uid });
      insertedServices.push(svc);
    }

    // Seed clients
    const clientData: InsertClient[] = [
      { name: "Marcus Thompson", email: "marcus.t@email.com", phone: "(512) 555-0147", address: "4821 Riverside Dr, Austin TX 78701", notes: "Prefers weekend appointments", isLead: false, createdAt: "2024-11-15T10:00:00Z", userId: uid },
      { name: "Sarah Chen", email: "sarah.chen@email.com", phone: "(512) 555-0283", address: "1200 Congress Ave, Austin TX 78701", notes: "Fleet account - 3 vehicles", isLead: false, createdAt: "2024-10-22T14:30:00Z", userId: uid },
      { name: "David Rodriguez", email: "d.rodriguez@email.com", phone: "(512) 555-0391", address: "7600 N Lamar Blvd, Austin TX 78752", notes: null, isLead: false, createdAt: "2025-01-05T09:00:00Z", userId: uid },
      { name: "Jennifer Walsh", email: "jwalsh@email.com", phone: "(512) 555-0465", address: "3400 S 1st St, Austin TX 78704", notes: "Referred by Marcus Thompson", isLead: false, createdAt: "2025-02-10T11:00:00Z", userId: uid },
      { name: "Tyler Kim", email: "tyler.kim@email.com", phone: "(512) 555-0512", address: "9001 Research Blvd, Austin TX 78758", notes: "Monthly ceramic maintenance plan", isLead: false, createdAt: "2024-12-01T16:00:00Z", userId: uid },
      { name: "New Lead", email: "", phone: "(512) 555-0678", address: null, notes: null, isLead: true, createdAt: "2025-04-07T08:30:00Z", userId: uid },
    ];
    const insertedClients: Client[] = [];
    for (const c of clientData) {
      insertedClients.push(this.createClient(c));
    }

    // Seed vehicles
    const vehicleData: InsertVehicle[] = [
      { clientId: insertedClients[0].id, make: "BMW", model: "M3", year: 2023, color: "Black Sapphire", size: "sedan", userId: uid },
      { clientId: insertedClients[1].id, make: "Toyota", model: "4Runner", year: 2024, color: "Lunar Rock", size: "suv", userId: uid },
      { clientId: insertedClients[2].id, make: "Ford", model: "F-150", year: 2022, color: "Oxford White", size: "suv", userId: uid },
      { clientId: insertedClients[3].id, make: "Tesla", model: "Model 3", year: 2024, color: "Pearl White", size: "sedan", userId: uid },
      { clientId: insertedClients[4].id, make: "Mercedes", model: "GLE 450", year: 2023, color: "Obsidian Black", size: "suv", userId: uid },
    ];
    const insertedVehicles: Vehicle[] = [];
    for (const v of vehicleData) {
      insertedVehicles.push(this.createVehicle(v));
    }

    // Seed appointments
    const now = new Date();
    const monday = new Date(now);
    const day = monday.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    monday.setDate(now.getDate() + diff);
    monday.setHours(0, 0, 0, 0);

    function findSvcId(name: string): number {
      const svc = insertedServices.find(s => s.name.toLowerCase().includes(name.toLowerCase()));
      return svc ? svc.id : insertedServices[0].id;
    }

    function getDateTime(baseDate: Date, dayOffset: number, hour: number, minute: number): string {
      const d = new Date(baseDate);
      d.setDate(d.getDate() + dayOffset);
      d.setHours(hour, minute, 0, 0);
      return d.toISOString();
    }

    const aptData: InsertAppointment[] = [
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
      this.createAppointment(a);
    }

    // Seed quotes
    const quoteData: InsertQuote[] = [
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
      this.createQuote(q);
    }

    // Seed messages
    const messageData: InsertMessage[] = [
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
      { clientId: insertedClients[5].id, content: "Hey, how much for a full detail on my Tahoe?", direction: "inbound", channel: "sms", sentAt: getDateTime(monday, 0, 8, 30), aiDraft: "Hey there! For a Full Detail (Interior + Exterior) on an SUV, we're at $320. Want me to get you on the schedule? I have openings this Thursday morning, Thursday afternoon, and next Friday.", userId: uid },
    ];
    for (const m of messageData) {
      this.createMessage(m);
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
      this.upsertSetting(s.key, s.value);
    }

    console.log("In-memory storage seeded with demo account (demo@detailflow.app / detailflow2026)");
  }
}

export const storage = new InMemoryStorage();
