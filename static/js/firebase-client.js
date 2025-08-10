// static/js/firebase-client.js
// Initialize Firebase Web SDK (v9 compat)
const firebaseConfig = {
  apiKey: "AIzaSyA0yc44K_S2E4GsBSNQe-fNqvJ_aWUGWzA",
  authDomain: "college-staff-manager.firebaseapp.com",
  projectId: "college-staff-manager",
  storageBucket: "college-staff-manager.firebasestorage.app",
  messagingSenderId: "787548552684",
  appId: "1:787548552684:web:b2c90de3f73c7ac93dd4c9",
  measurementId: "G-9KH2363DYT"
};

firebase.initializeApp(firebaseConfig);

// Main sign-in function that matches Flutter AuthService logic exactly
async function signInWithEmailAndPassword(email, password) {
  try {
    // First try to login with Firebase Authentication (existing users)
    const result = await firebase.auth().signInWithEmailAndPassword(email, password);
    console.log('Firebase auth successful');
    return result;
  } catch (e) {
    console.log('No existing auth account, checking staff collection:', e);
    
    // If auth login fails, check if user exists in staff collection
    try {
      const staffQuery = await firebase.firestore()
        .collection('staff')
        .where('email', '==', email)
        .get(); // Query just by email first

      // Check if any of the returned documents have a matching phone
      let foundMatch = false;
      let matchingStaff = null;

      for (const doc of staffQuery.docs) {
        const staffData = doc.data();
        const storedPhone = (staffData.mobileNo || '').toString();
        
        // Check if stored phone matches password
        if (storedPhone === password) {
          foundMatch = true;
          matchingStaff = staffData;
          break;
        }
      }

      if (foundMatch && matchingStaff) {
        // Staff exists in Firestore but no auth account yet, create one
        console.log('Creating auth account for staff member');
        const newUser = await firebase.auth().createUserWithEmailAndPassword(email, password);
        
        // Create user document in users collection
        await firebase.firestore().collection('users').doc(newUser.user.uid).set({
          email: email,
          isAdmin: false,
          staffId: matchingStaff.slNo || matchingStaff['Sl No'] || '',
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        console.log('Staff auth account created successfully');
        return newUser;
      } else {
        // No matching staff found
        console.log('No matching staff found in database');
        throw new Error('Invalid credentials');
      }
    } catch (staffError) {
      console.log('Error checking staff collection:', staffError);
      throw new Error('Login failed');
    }
  }
}

// Check if user is admin
async function checkAdminStatus(user) {
  if (!user) return false;
  
  try {
    const userDoc = await firebase.firestore().collection('users').doc(user.uid).get();
    if (userDoc.exists) {
      const userData = userDoc.data();
      return userData.isAdmin || false;
    }
    return false;
  } catch (error) {
    console.log('Error checking admin status:', error);
    return false;
  }
}

// Get ID token for authenticated requests
async function getIdToken() {
  const user = firebase.auth().currentUser;
  if (!user) return null;
  return await user.getIdToken(true);
}

// Auth state change listener
function onAuthStateChanged(callback) {
  return firebase.auth().onAuthStateChanged(callback);
}

// Sign out
async function signOut() {
  return await firebase.auth().signOut();
}