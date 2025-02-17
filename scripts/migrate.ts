import nodeFetch from 'node-fetch'
import fs from 'fs'
import path from 'path'

const projectRef = 'irppfrkmpbowdiqnokxr'
const accessToken = 'sbp_b0c7c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0' // Replace with your access token

async function runMigration(): Promise<void> {
  try {
    // Read migration file
    const migrationPath = path.join(process.cwd(), 'supabase', 'migrations', '20240318_create_bots_table.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8')

    console.log('Executing migration...')
    console.log('SQL:', migrationSQL)

    // Execute SQL using Management API
    const response = await nodeFetch(`https://api.supabase.com/v1/projects/${projectRef}/sql`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query: migrationSQL
      })
    })

    const responseText = await response.text()
    console.log('Response:', responseText)

    if (!response.ok) {
      throw new Error(responseText)
    }

    console.log('Migration successful!')
    process.exit(0)
  } catch (error) {
    console.error('Migration failed:', error)
    process.exit(1)
  }
}

runMigration() 