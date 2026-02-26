const functions = require('firebase-functions')
const admin = require('firebase-admin')

admin.initializeApp()

const USERS_COLLECTION = 'users'

/**
 * When a user is deleted from Firebase Authentication (e.g. from Console),
 * mark their Firestore profile so they no longer appear in the sharing user search.
 */
exports.onAuthUserDeleted = functions.auth.user().onDelete(async (user) => {
  const userRef = admin.firestore().collection(USERS_COLLECTION).doc(user.uid)
  await userRef.update({ deletedAt: admin.firestore.FieldValue.serverTimestamp() })
})

/**
 * One-time cleanup: mark all Firestore user profiles whose Auth account no longer exists.
 * Call once to fix users deleted from Auth before the trigger was deployed.
 * Secured by ?secret=YOUR_CLEANUP_SECRET (set via firebase functions:config:set cleanup.secret "your-secret").
 */
exports.cleanupDeletedUsers = functions.https.onRequest(async (req, res) => {
  const secret = functions.config().cleanup?.secret
  if (secret && req.query.secret !== secret) {
    res.status(403).json({ error: 'Forbidden' })
    return
  }

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
  const batch = db.batch()
  let count = 0
  usersSnap.docs.forEach((doc) => {
    if (doc.data().deletedAt) return
    if (!authUids.has(doc.id)) {
      batch.update(doc.ref, { deletedAt: admin.firestore.FieldValue.serverTimestamp() })
      count++
    }
  })
  await batch.commit()
  res.json({ ok: true, markedDeleted: count })
})
