import { FirebaseError } from "firebase/app";
import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";

import { API_BASE_URL } from "../config/api";
import { auth, db, isFirebaseConfigured, missingFirebaseKeys } from "../config/firebase";

export type LoginPayload = {
  identifier: string;
  password: string;
  rememberMe: boolean;
};

export type RegisterPayload = {
  firstName: string;
  lastName: string;
  email: string;
  enrollment: string;
  lawFirm: string;
  username: string;
  password: string;
};

const getFirebaseSetupMessage = () =>
  `El cliente de Firebase no esta configurado. Completa EXPO_PUBLIC_FIREBASE_* en tu .env. Faltan: ${missingFirebaseKeys.join(", ")}.`;

const mapFirebaseAuthError = (code: string) => {
  switch (code) {
    case "auth/invalid-email":
      return "El email ingresado no es valido.";
    case "auth/user-not-found":
      return "No existe una cuenta con este email.";
    case "auth/wrong-password":
      return "La contrasena es incorrecta.";
    case "auth/email-already-in-use":
      return "Ya existe una cuenta registrada con este email.";
    case "auth/weak-password":
      return "La contrasena es demasiado debil.";
    case "auth/invalid-credential":
      return "Las credenciales ingresadas no son validas.";
    default:
      return "No pudimos completar la operacion. Intenta nuevamente.";
  }
};

type ResolveUserResponse = {
  success?: boolean;
  data?: {
    success?: boolean;
    email?: string;
    message?: string;
  };
  email?: string;
  message?: string;
};

async function readResolveUserResponse(response: Response): Promise<ResolveUserResponse> {
  try {
    return (await response.json()) as ResolveUserResponse;
  } catch {
    return {};
  }
}

function getResolveLoginUrl() {
  const baseUrl = API_BASE_URL.replace(/\/+$/, "");
  const path = baseUrl.endsWith("/api/v1")
    ? "/auth/resolve-login"
    : "/api/v1/auth/resolve-login";

  return `${baseUrl}${path}`;
}

async function resolveLoginEmail(identifier: string) {
  const normalizedIdentifier = identifier.trim();

  if (!normalizedIdentifier) {
    throw new Error("Completa Email o usuario y la contrasena para continuar.");
  }

  console.log("[LOGIN] identifier:", normalizedIdentifier);

  if (normalizedIdentifier.includes("@")) {
    console.log("[LOGIN] email resuelto:", normalizedIdentifier);
    return normalizedIdentifier;
  }

  try {
    console.log("[LOGIN] resolviendo usuario...");

    const response = await fetch(getResolveLoginUrl(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        identifier: normalizedIdentifier,
      }),
    });

    const data = await readResolveUserResponse(response);
    console.log("[LOGIN] response resolve-login:", data);

    const isSuccess = data.success || data.data?.success;
    const resolvedEmail = data.email || data.data?.email;

    if (!response.ok || !isSuccess || !resolvedEmail) {
      throw new Error(
        data.message || data.data?.message || "No pudimos resolver el usuario ingresado",
      );
    }

    const emailToLogin = resolvedEmail.trim();
    console.log("[LOGIN] email resuelto:", emailToLogin);

    return emailToLogin;
  } catch (error) {
    throw error instanceof Error
      ? error
      : new Error("No pudimos resolver el usuario ingresado");
  }
}

export const authClient = {
  async login(payload: LoginPayload) {
    if (!payload.identifier || !payload.password) {
      throw new Error("Completa Email o usuario y la contrasena para continuar.");
    }

    if (!isFirebaseConfigured || !auth) {
      throw new Error(getFirebaseSetupMessage());
    }

    try {
      const email = await resolveLoginEmail(payload.identifier);

      const credential = await signInWithEmailAndPassword(
        auth,
        email,
        payload.password,
      );

      return {
        ok: true,
        mode: "firebase-auth",
        user: credential.user,
      };
    } catch (error) {
      if (error instanceof FirebaseError) {
        throw new Error(mapFirebaseAuthError(error.code));
      }

      throw error;
    }
  },

  async register(payload: RegisterPayload) {
    if (!payload.firstName || !payload.lastName || !payload.email) {
      throw new Error("Completa los datos obligatorios para crear la cuenta.");
    }

    if (!isFirebaseConfigured || !auth) {
      throw new Error(getFirebaseSetupMessage());
    }

    try {
      const credential = await createUserWithEmailAndPassword(
        auth,
        payload.email.trim(),
        payload.password,
      );

      const fullName = `${payload.firstName} ${payload.lastName}`.trim();

      await updateProfile(credential.user, {
        displayName: fullName,
      });

      if (db) {
        await setDoc(doc(db, "users", credential.user.uid), {
          uid: credential.user.uid,
          email: payload.email.trim(),
          firstName: payload.firstName,
          lastName: payload.lastName,
          fullName,
          username: payload.username,
          enrollment: payload.enrollment || null,
          lawFirm: payload.lawFirm || null,
          createdAt: serverTimestamp(),
        });
      }

      return {
        ok: true,
        mode: "firebase-auth",
        user: credential.user,
      };
    } catch (error) {
      if (error instanceof FirebaseError) {
        throw new Error(mapFirebaseAuthError(error.code));
      }

      throw error;
    }
  },

  async resetPassword(email: string) {
    const normalizedEmail = email.trim();

    if (!normalizedEmail) {
      throw new Error("Ingresa tu email para continuar.");
    }

    if (!isFirebaseConfigured || !auth) {
      throw new Error(getFirebaseSetupMessage());
    }

    try {
      await sendPasswordResetEmail(auth, normalizedEmail);
      return {
        ok: true,
        mode: "firebase-auth",
      };
    } catch (error) {
      if (error instanceof FirebaseError) {
        throw new Error(mapFirebaseAuthError(error.code));
      }

      throw error;
    }
  },
};
