import { initializeApp } from 'firebase/app';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Configuración de Firebase
// IMPORTANTE: Reemplaza estos valores con los de tu proyecto Firebase Gym11
// Ve a https://console.firebase.google.com/ y crea un proyecto
// Luego copia este archivo como firebase.ts y reemplaza los valores
const firebaseConfig = {
  apiKey: "TU_API_KEY_AQUI",
  authDomain: "tu-proyecto.firebaseapp.com",
  projectId: "tu-proyecto",
  storageBucket: "tu-proyecto.firebasestorage.app",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Inicializar servicios
// Caché persistente: lo que se anota sin señal sobrevive a cerrar la app y se sube al volver.
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
});
export const auth = getAuth(app);

export default app;
