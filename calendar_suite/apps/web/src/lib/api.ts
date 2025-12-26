import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  Timestamp,
  getDoc,
  QueryDocumentSnapshot,
  DocumentData,
  DocumentSnapshot
} from "firebase/firestore";
import { db, firebaseAuth } from "./firebase";

export type Page<T> = {
  content: T[];
  totalElements?: number;
  totalPages?: number;
  number?: number;
  size?: number;
};

export type ApiError = {
  code: string;
  message: string;
  details?: unknown;
};

// ---- types ----
export type Event = {
  id: string;
  calendar_id: string;
  title: string;
  description?: string | null;
  start_at: string; // ISO
  end_at: string; // ISO
  is_all_day: boolean;
  color?: string | null; // ✅ Added color
};

export type TaskStatus = "PENDING" | "COMPLETED" | "CANCELLED";
export type TaskPriority = "LOW" | "MEDIUM" | "HIGH";

export type Task = {
  id: string;
  calendar_id: string;
  title: string;
  description?: string | null;
  due_at: string; // ISO
  status: TaskStatus;
  priority?: TaskPriority | null;
  type?: string | null; // e.g. "MEMO"
};

export type Note = {
  id: string;
  calendar_id: string;
  date: string; // YYYY-MM-DD
  title?: string | null;
  memo?: string | null;
};

// Helper to get current user ID
const getUid = () => {
  const uid = firebaseAuth.currentUser?.uid;
  if (!uid) throw new Error("Not authenticated");
  return uid;
};

// Helper to convert Firestore doc to Event
const docToEvent = (d: DocumentSnapshot<DocumentData> | QueryDocumentSnapshot<DocumentData>): Event => {
  const data = d.data();
  if (!data) throw new Error("Document data missing");
  return {
    id: d.id,
    calendar_id: data.calendar_id,
    title: data.title,
    description: data.description,
    start_at: data.start_at,
    end_at: data.end_at,
    is_all_day: data.is_all_day,
    color: data.color, // ✅ Added color
  };
};

// Helper to convert Firestore doc to Task
const docToTask = (d: DocumentSnapshot<DocumentData> | QueryDocumentSnapshot<DocumentData>): Task => {
  const data = d.data();
  if (!data) throw new Error("Document data missing");
  return {
    id: d.id,
    calendar_id: data.calendar_id,
    title: data.title,
    description: data.description,
    due_at: data.due_at,
    status: data.status,
    priority: data.priority,
    type: data.type,
  };
};

export const calendarsApi = {
  async list(): Promise<Array<{ id: string; name?: string | null }>> {
    // For now, return a default calendar. 
    // In a real app, we would fetch from 'calendars' collection.
    return [{ id: "default", name: "My Calendar" }];
  },
};

export const eventsApi = {
  async list(params?: { dateFrom?: string; dateTo?: string; calendarId?: string }): Promise<Page<Event>> {
    const uid = getUid();
    const constraints = [where("uid", "==", uid)];

    if (params?.calendarId) {
      constraints.push(where("calendar_id", "==", params.calendarId));
    }
    // Note: Firestore range queries on dates require an index if mixed with other fields.
    // For simplicity in this term project, we might fetch all (or filtered by month if indexed) 
    // and filter in memory if the dataset is small, OR just rely on client-side filtering if needed.
    // Here we'll try to filter by start_at if possible, but let's just fetch by calendar for now to avoid index issues.

    const q = query(collection(db, "events"), ...constraints);
    const snap = await getDocs(q);
    const events = snap.docs.map(docToEvent);

    // Simple client-side date filtering to match API behavior
    const filtered = events.filter(e => {
      if (params?.dateFrom && e.end_at < params.dateFrom) return false;
      if (params?.dateTo && e.start_at > params.dateTo) return false;
      return true;
    });

    return { content: filtered };
  },

  async create(input: {
    calendar_id: string;
    title: string;
    description?: string | null;
    is_all_day: boolean;
    start_at: string;
    end_at: string;
    color?: string | null; // ✅ Added color
  }): Promise<Event> {
    const uid = getUid();
    const docRef = await addDoc(collection(db, "events"), {
      ...input,
      uid,
      created_at: Timestamp.now(),
    });
    return { id: docRef.id, ...input };
  },

  async update(
    id: string,
    input: Partial<{
      title: string;
      description: string | null;
      is_all_day: boolean;
      start_at: string;
      end_at: string;
      color: string | null; // ✅ Added color
    }>
  ): Promise<Event> {
    const docRef = doc(db, "events", id);
    await updateDoc(docRef, input);
    const snap = await getDoc(docRef);
    return docToEvent(snap);
  },

  async remove(id: string): Promise<void> {
    await deleteDoc(doc(db, "events", id));
  },
};

export const taskApi = {
  async list(params?: { dateFrom?: string; dateTo?: string; calendarId?: string }): Promise<Page<Task>> {
    const uid = getUid();
    const constraints = [where("uid", "==", uid)];

    if (params?.calendarId) {
      constraints.push(where("calendar_id", "==", params.calendarId));
    }

    const q = query(collection(db, "tasks"), ...constraints);
    const snap = await getDocs(q);
    const tasks = snap.docs.map(docToTask);

    // Client-side filtering
    const filtered = tasks.filter(t => {
      if (params?.dateFrom && t.due_at < params.dateFrom) return false;
      if (params?.dateTo && t.due_at > params.dateTo) return false;
      return true;
    });

    return { content: filtered };
  },

  async create(input: {
    calendar_id: string;
    title: string;
    description?: string | null;
    due_at: string;
    status?: TaskStatus;
    priority?: TaskPriority | null;
    type?: string | null;
  }): Promise<Task> {
    const uid = getUid();
    const data = {
      ...input,
      status: input.status ?? "PENDING",
      uid,
      created_at: Timestamp.now(),
    };
    const docRef = await addDoc(collection(db, "tasks"), data);
    return { id: docRef.id, ...data };
  },

  async update(
    id: string,
    input: Partial<{
      title: string;
      description: string | null;
      due_at: string;
      status: TaskStatus;
      priority: TaskPriority | null;
      type: string | null;
    }>
  ): Promise<Task> {
    const docRef = doc(db, "tasks", id);
    await updateDoc(docRef, input);
    const snap = await getDoc(docRef);
    return docToTask(snap);
  },

  async remove(id: string): Promise<void> {
    await deleteDoc(doc(db, "tasks", id));
  },

  async toggleComplete(id: string, completed: boolean): Promise<Task> {
    const nextStatus: TaskStatus = completed ? "COMPLETED" : "PENDING";
    return await taskApi.update(id, { status: nextStatus });
  },
};

// notes stub
export const notesApi = {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async create(_input: unknown): Promise<Note> {
    throw new Error("Not implemented");
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async update(_id: string, _input: unknown): Promise<Note> {
    throw new Error("Not implemented");
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async remove(_id: string): Promise<void> {
    throw new Error("Not implemented");
  },
};
