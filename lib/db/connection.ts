import mongoose from 'mongoose';

type MongooseConnection = typeof mongoose;

declare global {
  var mongoose: {
    conn: MongooseConnection | null;
    promise: Promise<MongooseConnection> | null;
  } | undefined;
}

const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
  throw new Error('Please define MONGODB_URI in environment variables');
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
const cached = global.mongoose || { conn: null, promise: null };

if (!global.mongoose) {
  global.mongoose = cached;
}

// Pre-load all models to prevent race conditions
let modelsLoaded = false;
async function loadModels() {
  if (!modelsLoaded) {
    // Import all models to ensure they're registered
    await Promise.all([
      import('@/lib/models/District'),
      import('@/lib/models/User'),
      import('@/lib/models/Doctor'),
      import('@/lib/models/Product'),
      import('@/lib/models/DistrictProduct'),
      import('@/lib/models/Patient'),
      import('@/lib/models/Prescription'),
      import('@/lib/models/Order'),
    ]);
    modelsLoaded = true;
  }
}

async function connectDB() {
  if (cached.conn) {
    await loadModels(); // Ensure models are loaded even if connection is cached
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then(async (mongoose) => {
      await loadModels(); // Load models after connection
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default connectDB;
export { connectDB };

