import { initializeApp } from "firebase/app";
// @ts-ignore
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
    apiKey: "AIzaSyDBpQIodZ_W2ddrgsGonFAYEHrTRbo6A-s",
    authDomain: "pb-term-6af38.firebaseapp.com",
    projectId: "pb-term-6af38",
    appId: "1:788435475840:web:742beeafe6eb2cfba07565", // Using web app ID for now, usually fine for JS SDK in Expo
};

const app = initializeApp(firebaseConfig);

export const auth = initializeAuth(app, {
    persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});
export const db = getFirestore(app);
