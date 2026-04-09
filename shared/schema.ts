import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  businessName: text("business_name").notNull().default(""),
  phone: text("phone").notNull().default(""),
  onboardingComplete: integer("onboarding_complete", { mode: "boolean" }).notNull().default(false),
  plan: text("plan").notNull().default("free"),
  stripeCustomerId: text("stripe_customer_id"),
  twilioPhone: text("twilio_phone"),
  autoCreateLeads: integer("auto_create_leads", { mode: "boolean" }).notNull().default(true),
  // Phone setup fields
  phoneSetupType: text("phone_setup_type"), // 'hosted' | 'provisioned' | null
  businessPhone: text("business_phone"), // the business number (hosted or provisioned)
  twilioPhoneSid: text("twilio_phone_sid"), // Twilio phone number SID
  phoneSetupStatus: text("phone_setup_status"), // 'pending' | 'verifying' | 'active' | 'failed' | null
  smsEnabled: integer("sms_enabled", { mode: "boolean" }).notNull().default(false),
  // AI auto-reply settings
  aiAutoReply: integer("ai_auto_reply", { mode: "boolean" }).notNull().default(true),
  aiAutoPrice: integer("ai_auto_price", { mode: "boolean" }).notNull().default(true),
  aiAutoSchedule: integer("ai_auto_schedule", { mode: "boolean" }).notNull().default(false),
  aiReplyStyle: text("ai_reply_style").notNull().default("casual"), // 'professional' | 'casual' | 'direct'
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const clients = sqliteTable("clients", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  email: text("email").notNull().default(""),
  phone: text("phone").notNull().default(""),
  address: text("address"),
  notes: text("notes"),
  isLead: integer("is_lead", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at").notNull(),
});

export const vehicles = sqliteTable("vehicles", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id),
  clientId: integer("client_id").notNull().references(() => clients.id),
  make: text("make").notNull(),
  model: text("model").notNull(),
  year: integer("year").notNull(),
  color: text("color").notNull(),
  size: text("size").notNull(),
});

export const services = sqliteTable("services", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  category: text("category").notNull().default("detailing"),
  sedanPrice: real("sedan_price"),
  suvPrice: real("suv_price"),
  vanPrice: real("van_price"),
  isFlat: integer("is_flat", { mode: "boolean" }).notNull().default(false),
  flatPrice: real("flat_price"),
  durationMinutes: integer("duration_minutes").notNull().default(60),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
});

export const appointments = sqliteTable("appointments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id),
  clientId: integer("client_id").notNull().references(() => clients.id),
  vehicleId: integer("vehicle_id").notNull().references(() => vehicles.id),
  serviceIds: text("service_ids").notNull(),
  scheduledAt: text("scheduled_at").notNull(),
  status: text("status").notNull().default("scheduled"),
  notes: text("notes"),
});

export const quotes = sqliteTable("quotes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id),
  clientId: integer("client_id").notNull().references(() => clients.id),
  vehicleId: integer("vehicle_id").notNull().references(() => vehicles.id),
  lineItems: text("line_items").notNull(),
  total: real("total").notNull(),
  status: text("status").notNull().default("draft"),
  createdAt: text("created_at").notNull(),
});

export const messages = sqliteTable("messages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id),
  clientId: integer("client_id").notNull().references(() => clients.id),
  content: text("content").notNull(),
  direction: text("direction").notNull(),
  channel: text("channel").notNull(),
  sentAt: text("sent_at").notNull(),
  aiDraft: text("ai_draft"),
  aiGenerated: integer("ai_generated", { mode: "boolean" }).notNull().default(false),
});

export const settings = sqliteTable("settings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const phoneSetupSchema = insertUserSchema.pick({ phoneSetupType: true, businessPhone: true, twilioPhoneSid: true, phoneSetupStatus: true, smsEnabled: true });
export const insertClientSchema = createInsertSchema(clients).omit({ id: true });
export const insertVehicleSchema = createInsertSchema(vehicles).omit({ id: true });
export const insertServiceSchema = createInsertSchema(services).omit({ id: true });
export const insertAppointmentSchema = createInsertSchema(appointments).omit({ id: true });
export const insertQuoteSchema = createInsertSchema(quotes).omit({ id: true });
export const insertMessageSchema = createInsertSchema(messages).omit({ id: true });
export const insertSettingSchema = createInsertSchema(settings).omit({ id: true });

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Client = typeof clients.$inferSelect;
export type InsertClient = z.infer<typeof insertClientSchema>;
export type Vehicle = typeof vehicles.$inferSelect;
export type InsertVehicle = z.infer<typeof insertVehicleSchema>;
export type Service = typeof services.$inferSelect;
export type InsertService = z.infer<typeof insertServiceSchema>;
export type Appointment = typeof appointments.$inferSelect;
export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;
export type Quote = typeof quotes.$inferSelect;
export type InsertQuote = z.infer<typeof insertQuoteSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Setting = typeof settings.$inferSelect;
export type InsertSetting = z.infer<typeof insertSettingSchema>;

// Service categories constant
export const SERVICE_CATEGORIES = [
  "Wash & Maintenance",
  "Full Detail",
  "Paint Correction",
  "Ceramic Coating",
  "Paint Protection Film (PPF)",
  "Window Tint",
  "Add-Ons",
] as const;

export type ServiceCategory = typeof SERVICE_CATEGORIES[number];
