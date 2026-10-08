import { z } from "zod";
import type { ItineraryItem, Trip, User } from "../types/models";

const id = z.number().int().positive();
const date = z.iso.date();
const nullableDate = date.nullable().optional();
const user = z.object({
  id,
  email: z.email(),
  full_name: z.string().nullable().optional(),
  is_active: z.boolean(),
  created_at: z.string(),
  updated_at: z.string().nullable().optional(),
}) satisfies z.ZodType<User>;
const trip = z.object({
  id,
  user_id: id,
  name: z.string().min(1).max(200),
  start_date: nullableDate,
  end_date: nullableDate,
  created_at: z.string(),
}) satisfies z.ZodType<Trip>;
const item = z.object({
  id,
  user_id: id,
  trip_id: id.nullable().optional(),
  place_title: z.string(),
  place_id_google: z.string().nullable().optional(),
  item_type: z.enum(["place", "hotel"]),
  visit_date: nullableDate,
  check_in_date: nullableDate,
  check_out_date: nullableDate,
  number_of_people: z.number().int().min(1).max(1000).nullable().optional(),
  start_time: z
    .string()
    .regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/)
    .nullable()
    .optional(),
  duration_minutes: z.number().int().min(1).max(1440).nullable().optional(),
  sort_order: z.number().int().nonnegative(),
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),
  custom_notes: z.string().nullable().optional(),
  formatted_address: z.string().nullable().optional(),
  image_url: z.null().optional(),
  created_at: z.string(),
  updated_at: z.string().nullable().optional(),
}) satisfies z.ZodType<ItineraryItem>;
export const snapshotSchema = z
  .object({
    version: z.literal(1),
    origin: z.string(),
    savedAt: z.string(),
    user,
    trips: z.array(trip).max(10000),
    items: z.array(item).max(10000),
    tripsLoaded: z.boolean(),
    itemsLoaded: z.boolean(),
  })
  .superRefine((value, context) => {
    if (
      value.trips.some((t) => t.user_id !== value.user.id) ||
      value.items.some((i) => i.user_id !== value.user.id)
    )
      context.addIssue({ code: "custom", message: "Dados de outra conta" });
  });
export type OfflineSnapshot = z.infer<typeof snapshotSchema>;
export interface OfflineStorage {
  read(token: string): Promise<OfflineSnapshot | null>;
  write(token: string, snapshot: OfflineSnapshot): Promise<void>;
  clear(): Promise<void>;
}
