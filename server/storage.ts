import {
  type Client, type InsertClient, clients,
  type Vehicle, type InsertVehicle, vehicles,
  type Service, type InsertService, services,
  type Appointment, type InsertAppointment, appointments,
  type Quote, type InsertQuote, quotes,
  type Message, type InsertMessage, messages,
  type Setting, type InsertSetting, settings,
  type User, type InsertUser, users,
} from "@shared/schema";
import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { eq, desc, asc, and, gte, lte, like, or, sql } from "drizzle-orm";

const sqlite = new Database("data.db");
sqlite.pragma("journal_mode = WAL");

export const db = drizzle(sqlite);

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

export class DatabaseStorage implements IStorage {
  // Users
  getUserByEmail(email: string): User | undefined {
    return db.select().from(users).where(eq(users.email, email)).get();
  }
  getUserById(id: number): User | undefined {
    return db.select().from(users).where(eq(users.id, id)).get();
  }
  getAllUsers(): User[] {
    return db.select().from(users).all();
  }
  getUserByBusinessPhone(phone: string): User | undefined {
    return db.select().from(users).where(eq(users.businessPhone, phone)).get();
  }
  createUser(data: InsertUser): User {
    return db.insert(users).values(data).returning().get();
  }
  updateUser(id: number, data: Partial<InsertUser>): User | undefined {
    return db.update(users).set(data).where(eq(users.id, id)).returning().get();
  }

  // Clients
  getClients(userId: number): Client[] {
    return db.select().from(clients).where(eq(clients.userId, userId)).orderBy(asc(clients.name)).all();
  }
  getClient(userId: number, id: number): Client | undefined {
    return db.select().from(clients).where(and(eq(clients.id, id), eq(clients.userId, userId))).get();
  }
  createClient(data: InsertClient): Client {
    return db.insert(clients).values(data).returning().get();
  }
  createClientsBulk(dataArray: InsertClient[]): Client[] {
    const results: Client[] = [];
    for (const data of dataArray) {
      const c = db.insert(clients).values(data).returning().get();
      results.push(c);
    }
    return results;
  }
  updateClient(userId: number, id: number, data: Partial<InsertClient>): Client | undefined {
    return db.update(clients).set(data).where(and(eq(clients.id, id), eq(clients.userId, userId))).returning().get();
  }
  searchClients(userId: number, query: string): Client[] {
    const pattern = `%${query}%`;
    return db.select().from(clients).where(
      and(
        eq(clients.userId, userId),
        or(
          like(clients.name, pattern),
          like(clients.email, pattern),
          like(clients.phone, pattern)
        )
      )
    ).all();
  }
  getClientByPhone(userId: number, phone: string): Client | undefined {
    return db.select().from(clients).where(
      and(eq(clients.userId, userId), eq(clients.phone, phone))
    ).get();
  }
  getNewLeadsCount(userId: number): number {
    const allClients = db.select().from(clients).where(
      and(eq(clients.userId, userId), eq(clients.isLead, true))
    ).all();
    return allClients.length;
  }
  getClientCount(userId: number): number {
    return db.select().from(clients).where(eq(clients.userId, userId)).all().length;
  }
  getClientsByPhones(userId: number, phones: string[]): Client[] {
    if (phones.length === 0) return [];
    return db.select().from(clients).where(
      eq(clients.userId, userId)
    ).all().filter(c => {
      const normalized = c.phone.replace(/\D/g, "");
      return phones.includes(normalized);
    });
  }

  // Vehicles
  getVehicles(userId: number): Vehicle[] {
    return db.select().from(vehicles).where(eq(vehicles.userId, userId)).all();
  }
  getVehiclesByClient(userId: number, clientId: number): Vehicle[] {
    return db.select().from(vehicles).where(and(eq(vehicles.clientId, clientId), eq(vehicles.userId, userId))).all();
  }
  getVehicle(userId: number, id: number): Vehicle | undefined {
    return db.select().from(vehicles).where(and(eq(vehicles.id, id), eq(vehicles.userId, userId))).get();
  }
  createVehicle(data: InsertVehicle): Vehicle {
    return db.insert(vehicles).values(data).returning().get();
  }

  // Services
  getServices(userId: number): Service[] {
    return db.select().from(services).where(eq(services.userId, userId)).all();
  }
  getServicesByUser(userId: number): Service[] {
    return db.select().from(services).where(
      and(eq(services.userId, userId), eq(services.active, true))
    ).all();
  }
  getService(userId: number, id: number): Service | undefined {
    return db.select().from(services).where(and(eq(services.id, id), eq(services.userId, userId))).get();
  }
  createService(data: InsertService): Service {
    return db.insert(services).values(data).returning().get();
  }
  updateService(userId: number, id: number, data: Partial<InsertService>): Service | undefined {
    return db.update(services).set(data).where(and(eq(services.id, id), eq(services.userId, userId))).returning().get();
  }

  // Appointments
  getAppointments(userId: number): Appointment[] {
    return db.select().from(appointments).where(eq(appointments.userId, userId)).orderBy(asc(appointments.scheduledAt)).all();
  }
  getAppointment(userId: number, id: number): Appointment | undefined {
    return db.select().from(appointments).where(and(eq(appointments.id, id), eq(appointments.userId, userId))).get();
  }
  getAppointmentsByDateRange(userId: number, start: string, end: string): Appointment[] {
    return db.select().from(appointments).where(
      and(
        eq(appointments.userId, userId),
        gte(appointments.scheduledAt, start),
        lte(appointments.scheduledAt, end)
      )
    ).orderBy(asc(appointments.scheduledAt)).all();
  }
  getUpcomingAppointments(userId: number, limit: number): Appointment[] {
    const now = new Date().toISOString();
    return db.select().from(appointments)
      .where(and(eq(appointments.userId, userId), gte(appointments.scheduledAt, now)))
      .orderBy(asc(appointments.scheduledAt))
      .limit(limit)
      .all();
  }
  createAppointment(data: InsertAppointment): Appointment {
    return db.insert(appointments).values(data).returning().get();
  }
  updateAppointment(userId: number, id: number, data: Partial<InsertAppointment>): Appointment | undefined {
    return db.update(appointments).set(data).where(and(eq(appointments.id, id), eq(appointments.userId, userId))).returning().get();
  }

  // Quotes
  getQuotes(userId: number): Quote[] {
    return db.select().from(quotes).where(eq(quotes.userId, userId)).orderBy(desc(quotes.createdAt)).all();
  }
  getQuote(userId: number, id: number): Quote | undefined {
    return db.select().from(quotes).where(and(eq(quotes.id, id), eq(quotes.userId, userId))).get();
  }
  createQuote(data: InsertQuote): Quote {
    return db.insert(quotes).values(data).returning().get();
  }
  updateQuote(userId: number, id: number, data: Partial<InsertQuote>): Quote | undefined {
    return db.update(quotes).set(data).where(and(eq(quotes.id, id), eq(quotes.userId, userId))).returning().get();
  }

  // Messages
  getMessages(userId: number): Message[] {
    return db.select().from(messages).where(eq(messages.userId, userId)).orderBy(asc(messages.sentAt)).all();
  }
  getMessagesByClient(userId: number, clientId: number): Message[] {
    return db.select().from(messages).where(and(eq(messages.clientId, clientId), eq(messages.userId, userId))).orderBy(asc(messages.sentAt)).all();
  }
  createMessage(data: InsertMessage): Message {
    return db.insert(messages).values(data).returning().get();
  }

  // Settings
  getSettings(): Setting[] {
    return db.select().from(settings).all();
  }
  getSetting(key: string): Setting | undefined {
    return db.select().from(settings).where(eq(settings.key, key)).get();
  }
  upsertSetting(key: string, value: string): Setting {
    const existing = this.getSetting(key);
    if (existing) {
      return db.update(settings).set({ value }).where(eq(settings.key, key)).returning().get();
    }
    return db.insert(settings).values({ key, value }).returning().get();
  }

  // Dashboard
  getDashboardStats(userId: number) {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString();

    const todayAppointments = db.select().from(appointments).where(
      and(
        eq(appointments.userId, userId),
        gte(appointments.scheduledAt, startOfDay),
        lte(appointments.scheduledAt, endOfDay)
      )
    ).all();

    const pendingQuotesList = db.select().from(quotes).where(
      and(
        eq(quotes.userId, userId),
        or(eq(quotes.status, "draft"), eq(quotes.status, "sent"))
      )
    ).all();

    const allMessages = db.select().from(messages).where(
      and(eq(messages.userId, userId), eq(messages.direction, "inbound"))
    ).all();

    let todayRevenue = 0;
    for (const apt of todayAppointments) {
      if (apt.status === "complete") {
        const svcIds: number[] = JSON.parse(apt.serviceIds);
        const vehicle = db.select().from(vehicles).where(and(eq(vehicles.id, apt.vehicleId), eq(vehicles.userId, userId))).get();
        for (const svcId of svcIds) {
          const svc = db.select().from(services).where(and(eq(services.id, svcId), eq(services.userId, userId))).get();
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
}

export const storage = new DatabaseStorage();
