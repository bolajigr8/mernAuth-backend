import mongoose from 'mongoose'
import { config } from '../config/app.config'

export default async function connectDB() {
  try {
    await mongoose.connect(config.MONGO_URI)

    console.log('MONGODB CONNECTION SUCCESS')
  } catch (error) {
    console.log('ERROR CONNECTING TO DATABASE')
    process.exit(1)
  }
}
