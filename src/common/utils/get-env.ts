import 'dotenv/config' // Load environment variables

// function to get environment variables with default values if not set in .env file

export const getEnv = (key: string, defaultValue?: string): string => {
  const value = process.env[key]
  if (value === undefined) {
    if (defaultValue) return defaultValue
    throw new Error(`Environment variable ${key} is not set`)
  }

  return value
}
