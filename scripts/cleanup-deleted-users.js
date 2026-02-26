/**
 * One-time cleanup: mark Firestore user profiles as deleted when their
 * Firebase Auth account no longer exists. Run this on your machine (no Blaze plan needed).
 *
 * Usage:
 *   1. Download a service account key from Firebase Console:
 *      Project settings → Service accounts → Generate new private key
 *   2. Save it as service-account.json in the project root (or set path below).
 *   3. Run: node scripts/cleanup-deleted-users.js
 *
 * Optional: GOOGLE_APPLICATION_CREDENTIALS=path/to/key.json node scripts/cleanup-deleted-users.js
 */

const path = require('path')
const fs = require('fs')

const projectRoot = path.join(__dirname, '..')
const defaultKeyPath = path.join(projectRoot, 'service-account.json')

const keyPath =
  process.env.GOOGLE_APPLICATION_CREDENTIALS ||
  (fs.existsSync(defaultKeyPath) ? defaultKeyPath : null)

if (!keyPath || !fs.existsSync(keyPath)) {
  console.error(
    'Missing service account key. Either:\n' +
      '  1. Save your key as service-account.json in the project root, or\n' +
      '  2. Set GOOGLE_APPLICATION_CREDENTIALS to the key file path.\n\n' +
      'Get the key: Firebase Console → Project settings → Service accounts → Generate new private key.'
  )
  process.exit(1)
}

const admin = require('firebase-admin')
const key = JSON.parse(fs.readFileSync(path.resolve(keyPath), 'utf8'))
admin.initializeApp({ credential: admin.credential.cert(key) })

const USERS_COLLECTION = 'users'

async function main() {
  const auth = admin.auth()
  const db = admin.firestore()

  const authUids = new Set()
  let nextPageToken
  do {
    const listResult = await auth.listUsers(1000, nextPageToken)
    listResult.users.forEach((u) => authUids.add(u.uid))
    nextPageToken = listResult.pageToken
  } while (nextPageToken)

  const usersSnap = await db.collection(USERS_COLLECTION).get()
  const toMark = []
  usersSnap.docs.forEach((doc) => {
    if (doc.data().deletedAt) return
    if (!authUids.has(doc.id)) toMark.push(doc.ref)
  })

  if (toMark.length === 0) {
    console.log('No orphaned user profiles found. All Firestore users have an Auth account.')
    process.exit(0)
    return
  }

  const BATCH_SIZE = 500
  for (let i = 0; i < toMark.length; i += BATCH_SIZE) {
    const batch = db.batch()
    toMark.slice(i, i + BATCH_SIZE).forEach((ref) => {
      batch.update(ref, { deletedAt: admin.firestore.FieldValue.serverTimestamp() })
    })
    await batch.commit()
  }
  console.log(`Marked ${toMark.length} user profile(s) as deleted. They will no longer appear in the sharing list.`)
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
