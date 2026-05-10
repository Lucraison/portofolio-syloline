import mongoose from "mongoose";

// Serverless functions are stateless — without caching, every request
// would open a fresh Mongo connection, exhaust the Atlas connection
// pool, and time out under load. We cache the connection on the
// `globalThis` object so it survives across serverless invocations
// that share the same Node process (warm starts).
//
// Pattern recommended by the Next.js + Mongoose docs.

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("Missing MONGODB_URI in environment");
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var __mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache =
  global.__mongooseCache ?? { conn: null, promise: null };

if (!global.__mongooseCache) {
  global.__mongooseCache = cached;
}

/**
 * Returns a connected mongoose instance. Safe to call repeatedly —
 * subsequent calls reuse the cached connection.
 */
export async function connectDb(): Promise<typeof mongoose> {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI!, {
      bufferCommands: false,
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (err) {
    // If the first connection attempt fails, drop the failed promise
    // so the next call re-tries instead of resolving to a dead error.
    cached.promise = null;
    throw err;
  }

  return cached.conn;
}
