import React, { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import { installStorage } from "./supabaseStorage";
import AuthScreen from "./AuthScreen.jsx";
import App from "./App.jsx";

export default function Root() {
  const [session, setSession] = useState(undefined); // undefined = töltés

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s ?? null));
    return () => sub.subscription.unsubscribe();
  }, []);

  if (session === undefined) {
    return (
      <div style={splash}>
        <span style={spin} />
      </div>
    );
  }

  if (!session) return <AuthScreen />;

  // A tárolót még az App felépülése előtt beállítjuk a felhasználóra.
  installStorage(session.user.id);

  return (
    <App
      key={session.user.id}
      account={{
        email: session.user.email,
        onSignOut: () => supabase.auth.signOut(),
      }}
    />
  );
}

const splash = {
  minHeight: "100%", display: "flex", alignItems: "center", justifyContent: "center",
  background: "radial-gradient(120% 80% at 10% -10%, #EFF2E8 0%, #E8ECE0 55%)",
};
const spin = {
  width: 30, height: 30, borderRadius: "50%",
  border: "3px solid #DCE2D0", borderTopColor: "#5B7350",
  animation: "uv-spin .8s linear infinite",
};
